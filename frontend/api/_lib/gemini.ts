// Calls Google Gemini's generateContent API and reads its JSON answer.

import { GEMINI_TIMEOUT_MS } from "./config.js";
import { HttpError } from "./helpers.js";
import { RESPONSE_SCHEMA, SYSTEM_PROMPT } from "./prompt.js";
import type { Energy, Suggestions } from "./types.js";

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models";

// "minimal", "low", "medium" or "high" on Gemini 3 Flash models. Set
// GEMINI_THINKING_LEVEL to try another.
const THINKING_LEVEL = process.env.GEMINI_THINKING_LEVEL || "low";

// Used when the main model is overloaded or too slow. Popular new models can
// return 503 "high demand" or hang for a while, so a second model keeps
// personalizing working. Set GEMINI_FALLBACK_MODEL to change it.
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash";

// How long the main model gets before we try the fallback with the time left.
const MAIN_MODEL_TIMEOUT_MS = 25_000;

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
};

// Errors worth retrying on another model: overloaded, rate limited, or slow.
class RetryableError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Asks the main model, then the fallback if the main one is overloaded or slow.
// Returns the suggestions and which model gave them.
export async function askGemini(
  apiKey: string,
  model: string,
  prompt: string,
  resumeBase64: string | null,
): Promise<Suggestions & { model: string }> {
  const deadline = Date.now() + GEMINI_TIMEOUT_MS;
  const models = model === FALLBACK_MODEL ? [model] : [model, FALLBACK_MODEL];

  let lastError: RetryableError | null = null;
  for (const [index, candidate] of models.entries()) {
    const timeLeft = deadline - Date.now();
    const isLast = index === models.length - 1;
    const timeout = isLast ? timeLeft : Math.min(MAIN_MODEL_TIMEOUT_MS, timeLeft);
    if (timeout < 3_000) break;

    try {
      const text = await generate(apiKey, candidate, prompt, resumeBase64, timeout);
      return { ...parseSuggestions(text), model: candidate };
    } catch (err) {
      if (!(err instanceof RetryableError)) throw err;
      console.warn(`Gemini ${candidate} unavailable (${err.message})`);
      lastError = err;
    }
  }

  throw lastError?.status === 429
    ? new HttpError(429, "The AI is busy right now. Please try again in a minute.")
    : new HttpError(504, "The AI took too long to respond. Please try again.");
}

// One generateContent call. Returns the answer's text.
async function generate(
  apiKey: string,
  model: string,
  prompt: string,
  resumeBase64: string | null,
  timeoutMs: number,
) {
  const parts: object[] = [];
  if (resumeBase64) {
    parts.push({ text: "Their resume (PDF):" });
    parts.push({ inlineData: { mimeType: "application/pdf", data: resumeBase64 } });
  }
  parts.push({ text: prompt });

  let response: Response;
  try {
    response = await fetch(
      `${GEMINI_API}/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
            // Gemini 3 thinks at "high" by default, which is slow enough to hit
            // our time limit. Rewording tasks doesn't need deep reasoning.
            thinkingConfig: { thinkingLevel: THINKING_LEVEL },
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      },
    );
  } catch (err) {
    // A timeout, or the connection dropped.
    throw new RetryableError(504, err instanceof Error ? err.name : String(err));
  }

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    if (response.status === 429 || response.status >= 500) {
      throw new RetryableError(response.status, `HTTP ${response.status}: ${detail}`);
    }
    console.error("Gemini error", response.status, detail);
    throw new HttpError(
      502,
      "The AI couldn't personalize your plan right now. Please try again.",
    );
  }

  return answerText((await response.json()) as GeminiResponse);
}

// The answer's text, leaving out any "thinking" parts.
function answerText(data: GeminiResponse) {
  return (data.candidates?.[0]?.content?.parts ?? [])
    .filter((part) => !part.thought && part.text)
    .map((part) => part.text)
    .join("");
}

function parseSuggestions(text: string): Suggestions {
  try {
    const parsed = JSON.parse(text) as {
      summary?: unknown;
      tasks?: { ref?: unknown; title?: unknown; energy?: unknown }[];
    };
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "",
      tasks: (Array.isArray(parsed.tasks) ? parsed.tasks : []).map((item) => ({
        ref: String(item.ref ?? ""),
        title: String(item.title ?? ""),
        energy: item.energy as Energy,
      })),
    };
  } catch {
    console.error("Gemini returned something that wasn't JSON", text.slice(0, 500));
    throw new HttpError(
      502,
      "The AI's answer didn't come through properly. Please try again.",
    );
  }
}
