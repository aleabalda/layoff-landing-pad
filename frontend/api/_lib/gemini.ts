// Calls Google Gemini's generateContent API for a JSON answer, with a fallback
// model when the main one is overloaded or slow. Used by every AI route.

import { GEMINI_TIMEOUT_MS } from "./config.js";
import { HttpError } from "./helpers.js";
import { RESPONSE_SCHEMA, SYSTEM_PROMPT } from "./prompt.js";
import type { Energy, Suggestions } from "./types.js";

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models";

// "minimal", "low", "medium" or "high" on Gemini 3 Flash models. Set
// GEMINI_THINKING_LEVEL to try another.
const THINKING_LEVEL = process.env.GEMINI_THINKING_LEVEL || "low";

// Tried in order after the main model (GEMINI_MODEL, or DEFAULT_MODEL in
// config.ts). Popular models can return 503 "high demand" or hang, so having
// several keeps the AI features working. Set GEMINI_FALLBACK_MODELS to a
// comma-separated list to change them.
const FALLBACK_MODELS = (
  process.env.GEMINI_FALLBACK_MODELS ||
  "gemini-3.6-flash,gemini-3.5-flash,gemini-3.1-flash-lite"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

// If a model hasn't answered by now, the next one starts alongside it and the
// first good answer wins. Healthy answers take about 2 to 13 seconds.
const HEDGE_AFTER_MS = 10_000;

// If every model fails fast (a demand spike), wait this long and go through
// them once more, as long as there's time left.
const SECOND_PASS_DELAY_MS = 2_000;
const MIN_TIME_FOR_SECOND_PASS_MS = 12_000;

export type GeminiRequest = {
  apiKey: string;
  model: string;
  system: string;
  prompt: string;
  // The JSON shape the answer must follow (Gemini's OpenAPI-style schema).
  schema: object;
  // A PDF to include, such as a resume, as base64.
  pdfBase64?: string | null;
  pdfLabel?: string;
};

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
};

// Errors worth trying another model for: overloaded, rate limited, slow, or
// an answer we couldn't read.
class RetryableError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Asks the main model, moving on to the fallbacks when one is overloaded or
// slow. Returns the parsed JSON (not yet checked) and which model answered.
export function generateJson(
  request: GeminiRequest,
): Promise<{ data: unknown; model: string }> {
  const deadline = Date.now() + GEMINI_TIMEOUT_MS;
  const chain = [...new Set([request.model, ...FALLBACK_MODELS])];

  return new Promise((resolve, reject) => {
    const controllers = new Set<AbortController>();
    let next = 0;
    let pass = 1;
    let running = 0;
    let settled = false;
    let lastError: RetryableError | null = null;

    const finish = (outcome: () => void) => {
      if (settled) return;
      settled = true;
      for (const controller of controllers) controller.abort();
      outcome();
    };

    const giveUp = () =>
      finish(() =>
        reject(
          lastError?.status === 429
            ? new HttpError(429, "The AI is busy right now. Please try again in a minute.")
            : new HttpError(504, "The AI is very busy right now. Please try again in a minute."),
        ),
      );

    const launch = () => {
      if (settled) return;
      const timeLeft = deadline - Date.now();

      if (next >= chain.length) {
        // Out of models. Go round once more if everything failed fast.
        if (running > 0) return;
        if (pass === 1 && timeLeft > MIN_TIME_FOR_SECOND_PASS_MS) {
          pass = 2;
          next = 0;
          setTimeout(launch, SECOND_PASS_DELAY_MS);
          return;
        }
        giveUp();
        return;
      }
      if (timeLeft < 2_000) {
        if (running === 0) giveUp();
        return;
      }

      const model = chain[next++];
      const controller = new AbortController();
      controllers.add(controller);
      running += 1;
      const timeout = setTimeout(() => controller.abort(), timeLeft);
      const hedge = setTimeout(launch, HEDGE_AFTER_MS);

      generate(request, model, controller.signal)
        .then((text) => {
          const data = parseJson(text);
          finish(() => resolve({ data, model }));
        })
        .catch((err) => {
          running -= 1;
          if (settled) return;
          if (!(err instanceof RetryableError)) {
            finish(() => reject(err));
            return;
          }
          console.warn(`Gemini ${model} unavailable (${err.message})`);
          lastError = err;
          clearTimeout(hedge);
          launch();
        })
        .finally(() => {
          clearTimeout(timeout);
          clearTimeout(hedge);
          controllers.delete(controller);
        });
    };

    launch();
  });
}

// One generateContent call. Returns the answer's text.
async function generate(request: GeminiRequest, model: string, signal: AbortSignal) {
  const parts: object[] = [];
  if (request.pdfBase64) {
    parts.push({ text: request.pdfLabel ?? "Attached PDF:" });
    parts.push({
      inlineData: { mimeType: "application/pdf", data: request.pdfBase64 },
    });
  }
  parts.push({ text: request.prompt });

  let response: Response;
  try {
    response = await fetch(
      `${GEMINI_API}/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": request.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: request.system }] },
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: request.schema,
            // Gemini 3 thinks at "high" by default, which is slow enough to hit
            // our time limit. These jobs don't need deep reasoning.
            thinkingConfig: { thinkingLevel: THINKING_LEVEL },
          },
        }),
        signal,
      },
    );
  } catch (err) {
    // Timed out, cancelled because another model answered, or the connection
    // dropped.
    throw new RetryableError(504, err instanceof Error ? err.name : String(err));
  }

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    if (response.status === 401 || response.status === 403) {
      console.error("Gemini rejected the API key", response.status, detail);
      throw new HttpError(500, "The AI isn't set up correctly.");
    }
    // Anything else might work on another model, such as a setting one model
    // doesn't support.
    throw new RetryableError(response.status, `HTTP ${response.status}: ${detail}`);
  }

  const data = (await response.json()) as GeminiResponse;
  // The answer's text, leaving out any "thinking" parts.
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .filter((part) => !part.thought && part.text)
    .map((part) => part.text)
    .join("");
  // Checked here so an unreadable answer moves on to the next model.
  parseJson(text);
  return text;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new RetryableError(502, `answer wasn't JSON: ${text.slice(0, 120)}`);
  }
}

// Plan personalization: this week's rewritten tasks.
export async function askGemini(
  apiKey: string,
  model: string,
  prompt: string,
  resumeBase64: string | null,
): Promise<Suggestions & { model: string }> {
  const result = await generateJson({
    apiKey,
    model,
    system: SYSTEM_PROMPT,
    prompt,
    schema: RESPONSE_SCHEMA,
    pdfBase64: resumeBase64,
    pdfLabel: "Their resume (PDF):",
  });

  const parsed = (result.data ?? {}) as {
    summary?: unknown;
    tasks?: { ref?: unknown; title?: unknown; energy?: unknown }[];
  };
  return {
    model: result.model,
    summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "",
    tasks: (Array.isArray(parsed.tasks) ? parsed.tasks : []).map((item) => ({
      ref: String(item.ref ?? ""),
      title: String(item.title ?? ""),
      energy: item.energy as Energy,
    })),
  };
}
