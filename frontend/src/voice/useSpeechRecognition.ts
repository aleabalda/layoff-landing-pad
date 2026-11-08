import { useCallback, useEffect, useRef, useState } from "react";

// Speech-to-text with the browser's built-in Web Speech API. Chrome, Edge and
// Safari support it; Firefox doesn't, so check `isSupported`. In Chrome the
// audio goes to Google's speech service to be transcribed; we never store it.

// The API isn't in TypeScript's built-in types everywhere, so just the parts
// we use are described here.
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = {
  resultIndex: number;
  results: { length: number; [index: number]: RecognitionResult };
};
type RecognitionErrorEvent = { error: string };
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};
type RecognitionConstructor = new () => Recognition;

const Recognition: RecognitionConstructor | undefined =
  typeof window === "undefined"
    ? undefined
    : ((window as unknown as Record<string, RecognitionConstructor | undefined>)
        .SpeechRecognition ??
      (window as unknown as Record<string, RecognitionConstructor | undefined>)
        .webkitSpeechRecognition);

export const isSpeechRecognitionSupported = !!Recognition;

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed":
    "Microphone access is blocked. Allow it in your browser's address bar, then try again.",
  "service-not-allowed":
    "Microphone access is blocked. Allow it in your browser's address bar, then try again.",
  "audio-capture": "We couldn't find a microphone. Check it's plugged in.",
  network: "Speech-to-text needs an internet connection. Try typing instead.",
};

// Browsers stop listening after a pause, so we keep restarting until the
// person presses stop. This caps how often, in case something's wrong.
const MAX_RESTARTS = 50;

// onFinished gets everything that was heard, once listening has fully stopped.
export function useSpeechRecognition(onFinished?: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false);
  // Everything heard since start(): settled text, and the words still being
  // worked out.
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<Recognition | null>(null);
  const wantsToListen = useRef(false);
  // Settled text from earlier runs, before the browser restarted.
  const earlierRuns = useRef("");
  const restarts = useRef(0);
  const onFinishedRef = useRef(onFinished);
  useEffect(() => {
    onFinishedRef.current = onFinished;
  });

  const stop = useCallback(() => {
    wantsToListen.current = false;
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    if (!Recognition || wantsToListen.current) return;

    setError(null);
    setTranscript("");
    setInterim("");
    earlierRuns.current = "";
    restarts.current = 0;
    wantsToListen.current = true;

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-CA";

    let thisRun = "";
    recognition.onresult = (event) => {
      let settled = "";
      let pending = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) settled += result[0].transcript;
        else pending += result[0].transcript;
      }
      thisRun = settled;
      setTranscript(joinSpeech(earlierRuns.current, settled));
      setInterim(pending.trim());
    };

    recognition.onerror = (event) => {
      // "no-speech" and "aborted" just mean a pause or a stop.
      if (event.error === "no-speech" || event.error === "aborted") return;
      wantsToListen.current = false;
      setError(
        ERROR_MESSAGES[event.error] ??
          "Something went wrong with speech-to-text. Try again, or type instead.",
      );
    };

    recognition.onend = () => {
      earlierRuns.current = joinSpeech(earlierRuns.current, thisRun);
      thisRun = "";
      setInterim("");
      if (wantsToListen.current && restarts.current < MAX_RESTARTS) {
        restarts.current += 1;
        try {
          recognition.start();
          return;
        } catch {
          // Falls through to stopping.
        }
      }
      wantsToListen.current = false;
      setIsListening(false);
      onFinishedRef.current?.(earlierRuns.current);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      wantsToListen.current = false;
      setError("Couldn't start the microphone. Try again, or type instead.");
    }
  }, []);

  // Stops listening if the page closes or the component goes away.
  useEffect(
    () => () => {
      wantsToListen.current = false;
      recognitionRef.current?.abort();
    },
    [],
  );

  return {
    isSupported: isSpeechRecognitionSupported,
    isListening,
    transcript,
    interim,
    error,
    start,
    stop,
  };
}

// Joins two bits of speech with a space, without doubling spaces.
export function joinSpeech(a: string, b: string) {
  return [a.trim(), b.trim()].filter(Boolean).join(" ");
}
