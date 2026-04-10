"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  /** Called with the captured JPEG blob and a preview object URL. */
  onCapture: (blob: Blob, previewUrl: string) => void;
  /** Called when the user clicks Retake so the parent can clear its preview. */
  onRetake?: () => void;
  /** Existing preview URL so the parent can control the "retake" state. */
  previewUrl: string | null;
}

const CAPTURE_SIZE = 512; // square crop

export function CameraCapture({ onCapture, onRetake, previewUrl }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const streaming = stream !== null && !previewUrl;

  // Attach stream to the video element whenever it changes. Because the video
  // element is always mounted, videoRef.current is guaranteed to be set here.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream) {
      video.srcObject = stream;
      video.play().catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to start video");
      });
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  // Stop all tracks on unmount.
  useEffect(() => {
    return () => {
      setStream((s) => {
        if (s) s.getTracks().forEach((t) => t.stop());
        return null;
      });
    };
  }, []);

  const stop = useCallback(() => {
    setStream((s) => {
      if (s) s.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      // Replace any previous stream (and stop its tracks).
      setStream((prev) => {
        if (prev) prev.getTracks().forEach((t) => t.stop());
        return mediaStream;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Camera unavailable");
    }
  }, []);

  const handleRetake = useCallback(() => {
    if (onRetake) onRetake();
    void start();
  }, [onRetake, start]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = CAPTURE_SIZE;
    canvas.height = CAPTURE_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (vw === 0 || vh === 0) {
      setError("Camera not ready yet — try again in a moment");
      return;
    }
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
        {/* Video is always mounted so the ref is stable. */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
        {/* Placeholder shown when idle (no stream, no preview). */}
        {!streaming && !previewUrl && (
          <div className="absolute inset-0 flex items-center justify-center text-muted bg-input-bg">
            <Camera className="h-8 w-8" />
          </div>
        )}
        {/* Captured photo overlays the video when present. */}
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Profile preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>

      {error && <p className="text-xs text-destructive text-center">{error}</p>}

      {!previewUrl && !streaming && (
        <Button type="button" variant="outline" size="sm" onClick={start}>
          <Camera className="h-4 w-4" />
          Open Camera
        </Button>
      )}

      {streaming && (
        <Button type="button" size="sm" onClick={capture}>
          <Check className="h-4 w-4" />
          Take Photo
        </Button>
      )}

      {previewUrl && (
        <Button type="button" variant="outline" size="sm" onClick={handleRetake}>
          <RefreshCw className="h-4 w-4" />
          Retake
        </Button>
      )}
    </div>
  );
}
