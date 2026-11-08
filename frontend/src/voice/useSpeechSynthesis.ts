import { useCallback, useEffect, useRef, useState } from "react";

// Text-to-speech with the browser's built-in speechSynthesis, which every
// modern browser supports. It runs on the device and costs nothing.

export const isSpeechSynthesisSupported =
  typeof window !== "undefined" && "speechSynthesis" in window;

// Chrome cuts off long utterances after about 15 seconds, so text is spoken a
// sentence or so at a time.
function toChunks(text: string) {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > 220 && current) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// A natural-sounding voice in the person's language, if the device has one.
function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  const language = (navigator.language || "en").slice(0, 2).toLowerCase();
  const matching = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith(language),
  );
  return (
    matching.find((voice) => /natural|neural|premium|enhanced|google/i.test(voice.name)) ??
    matching.find((voice) => voice.default) ??
    matching[0] ??
    null
  );
}

export function useSpeechSynthesis() {
  // Which bit of text is being read, so its button can show "Stop".
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  // Bumped on every speak() or stop(), so a stopped reading doesn't carry on.
  const run = useRef(0);

  const stop = useCallback(() => {
    run.current += 1;
    if (isSpeechSynthesisSupported) window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  // Reads text aloud. onDone runs only if it finishes without being stopped.
  const speak = useCallback(
    (id: string, text: string, onDone?: () => void) => {
      if (!isSpeechSynthesisSupported || !text.trim()) {
        onDone?.();
        return;
      }
      const synth = window.speechSynthesis;
      synth.cancel();
      const thisRun = ++run.current;
      const voice = pickVoice();
      const chunks = toChunks(text);
      setSpeakingId(id);

      const speakChunk = (index: number) => {
        if (run.current !== thisRun) return;
        if (index >= chunks.length) {
          setSpeakingId(null);
          onDone?.();
          return;
        }
        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang ?? navigator.language;
        utterance.onend = () => speakChunk(index + 1);
        utterance.onerror = () => {
          if (run.current === thisRun) setSpeakingId(null);
        };
        synth.speak(utterance);
      };
      speakChunk(0);
    },
    [],
  );

  // Voices load in the background in some browsers; this nudges them early.
  // Stops reading when the component goes away.
  useEffect(() => {
    if (isSpeechSynthesisSupported) window.speechSynthesis.getVoices();
    return () => {
      run.current += 1;
      if (isSpeechSynthesisSupported) window.speechSynthesis.cancel();
    };
  }, []);

  return { isSupported: isSpeechSynthesisSupported, speakingId, speak, stop };
}
