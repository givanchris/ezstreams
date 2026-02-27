import { useState, useCallback, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceSearchButtonProps {
  onResult: (transcript: string) => void;
  className?: string;
}

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

const VoiceSearchButton = ({ onResult, className }: VoiceSearchButtonProps) => {
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (!SpeechRecognitionAPI) return;
    const rec = new SpeechRecognitionAPI();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      onResult(transcript);
    };

    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    setRecognition(rec);
    return () => {
      try { rec.abort(); } catch {}
    };
  }, [onResult]);

  const toggle = useCallback(() => {
    if (!recognition) return;
    if (listening) {
      recognition.abort();
      setListening(false);
    } else {
      recognition.start();
      setListening(true);
    }
  }, [recognition, listening]);

  if (!SpeechRecognitionAPI) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? "Stop listening" : "Voice search"}
      className={cn(
        "p-2 rounded-lg transition-colors",
        listening
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
        className
      )}
    >
      {listening ? (
        <MicOff className="w-5 h-5 animate-pulse" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  );
};

export default VoiceSearchButton;
