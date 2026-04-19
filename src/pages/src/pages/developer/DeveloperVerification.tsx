import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { VERIFICATION_SCRIPT } from "./verificationScript";

const MATCH_THRESHOLD = 60;

export default function DeveloperVerification() {
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [match, setMatch] = useState(0);

  // --- Speech Recognition ---
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(" ");

      setTranscript(text);
      calculateMatch(text);
    };

    // 🔥 CLEANUP ON UNMOUNT
    return () => {
      stopCamera();
    };
  }, []);

  // --- Match calculation ---
  function calculateMatch(spokenText: string) {
    const targetWords = VERIFICATION_SCRIPT.toLowerCase().split(" ");
    const spokenWords = spokenText.toLowerCase().split(" ");

    const matchedWords = targetWords.filter(word =>
      spokenWords.includes(word)
    ).length;

    const percentage = Math.round(
      (matchedWords / targetWords.length) * 100
    );

    setMatch(Math.min(100, percentage));
  }

  // --- Stop camera completely ---
  function stopCamera() {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  // --- Start recording ---
  async function startRecording() {
    localStorage.setItem("developer_verification_status", "recording");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    mediaStreamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    recorder.start();
    recognitionRef.current.start();
    setRecording(true);
  }

  // --- Stop recording ---
  function stopRecording() {
    mediaRecorderRef.current?.stop();
    recognitionRef.current.stop();
    stopCamera();

    setRecording(false);
    localStorage.setItem("developer_verification_status", "ready");
  }

  // --- Submit verification ---
  function submitVerification() {
    if (match < MATCH_THRESHOLD) return;

    stopCamera(); // 🔥 IMPORTANT

    localStorage.setItem("developer_verification_status", "verified");
    navigate("/developer");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Developer Verification</h1>

      <Card>
        <CardContent className="p-6 space-y-6 text-center">
          <p className="text-sm text-zinc-600">
            Read the following statement clearly and completely:
          </p>

          <p className="bg-zinc-100 p-4 rounded font-medium">
            {VERIFICATION_SCRIPT}
          </p>

          {/* Video Feed */}
          <video
            ref={videoRef}
            autoPlay
            muted
            className="mx-auto w-64 rounded border"
          />

          {/* Transcript */}
          <div className="text-left text-sm text-zinc-600 bg-zinc-50 p-3 rounded min-h-[60px]">
            {transcript || "Live transcript will appear here..."}
          </div>

          {/* Match */}
          <p className="font-semibold">
            Match Accuracy:{" "}
            <span
              className={
                match >= MATCH_THRESHOLD
                  ? "text-green-600"
                  : "text-zinc-800"
              }
            >
              {match}%
            </span>
          </p>

          {match >= MATCH_THRESHOLD && (
            <p className="text-xs text-green-600">
              ✔ Script verified. You can submit now.
            </p>
          )}

          {/* Controls */}
          {!recording ? (
            <Button onClick={startRecording}>
              Start Recording
            </Button>
          ) : (
            <Button variant="danger" onClick={stopRecording}>
              Stop Recording
            </Button>
          )}

          {/* Submit */}
          {match >= MATCH_THRESHOLD && !recording && (
            <Button
              className="w-full mt-4"
              onClick={submitVerification}
            >
              Submit Verification
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}