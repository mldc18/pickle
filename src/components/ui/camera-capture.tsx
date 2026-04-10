"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  /** Called with the captured JPEG blob and a preview object URL. */
  onCapture: (blob: Blob, previewUrl: string) => void;
  /** Existing preview URL so the parent can control the "retake" state. */
  previewUrl: string | null;
}

const CAPTURE_SIZE = 512; // square crop

export function CameraCapture({ onCapture, previewUrl }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStreaming(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Camera unavailable");
    }
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = CAPTURE_SIZE;
    canvas.height = CAPTURE_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Center-crop the video into a square
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const side = Math.min(vw, vh);
    const sx = (vw - side) / 2;
    const sy = (vh - side) / 2;
    ctx.drawImage(video, sx, sy, side, side, 0, 0, CAPTURE_SIZE, CAPTURE_SIZE);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        onCapture(blob, url);
        stop();
      },
      "image/jpeg",
      0.85,
    );
  }, [onCapture, stop]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-40 h-40 rounded-[20px] overflow-hidden bg-input-bg border border-card-border">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          style={{ display: streaming && !previewUrl ? "block" : "none" }}
        />
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Profile preview" className="absolute inset-0 w-full h-full object-cover" />
        ) : streaming ? null : (
          <div className="absolute inset-0 flex items-center justify-center text-muted">
            <Camera className="h-8 w-8" />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive text-center">{error}</p>}

      {!previewUrl && !streaming && (
        <Button type="button" variant="outline" size="sm" onClick={start}>
          <Camera className="h-4 w-4" />
          Open Camera
        </Button>
      )}

      {streaming && !previewUrl && (
        <Button type="button" size="sm" onClick={capture}>
          <Check className="h-4 w-4" />
          Take Photo
        </Button>
      )}

      {previewUrl && (
        <Button type="button" variant="outline" size="sm" onClick={start}>
          <RefreshCw className="h-4 w-4" />
          Retake
        </Button>
      )}
    </div>
  );
}
