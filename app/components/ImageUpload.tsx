"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

type PredictionResponse = {
  label?: string;
  labelName?: string;
  confidence?: number | string;
  dangerLevel?: string;
};

const LABEL_MAP: Record<string, string> = {
  "pest-big": "S\u00e2u l\u1edbn",
  "round-pest": "S\u00e2u tr\u00f2n",
  thin_pest: "S\u00e2u d\u00e0i",
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

function formatConfidence(value?: number | string) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") return value;
  const percent = value <= 1 ? value * 100 : value;
  return `${percent.toFixed(2)}%`;
}

export default function ImageUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const endpoint = useMemo(() => "/api/predict", []);

  const handleFile = useCallback((nextFile: File) => {
    if (!nextFile.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    if (ACCEPTED_TYPES.length > 0 && !ACCEPTED_TYPES.includes(nextFile.type)) {
      setError("Unsupported image format. Use JPG or PNG.");
      return;
    }

    setError(null);
    setResult(null);
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextFile = event.target.files?.[0];
      if (nextFile) handleFile(nextFile);
    },
    [handleFile]
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const nextFile = event.dataTransfer.files?.[0];
      if (nextFile) handleFile(nextFile);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!file) {
      setError("Please select an image before predicting.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload?.detail ||
          payload?.message ||
          `Server error (${response.status}).`;
        throw new Error(message);
      }

      const data = payload?.data ?? payload;
      setResult({
        label: data?.id ?? payload?.label,
        labelName: data?.name_vi,
        confidence: data?.confidence ?? payload?.confidence,
        dangerLevel: data?.danger_level,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to reach backend.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, file]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const friendlyLabel =
    result?.labelName || (result?.label ? LABEL_MAP[result.label] || result.label : null);
  const confidenceText = formatConfidence(result?.confidence);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_-50px_rgba(15,23,42,0.8)]">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFilePicker();
            }
          }}
          role="button"
          tabIndex={0}
          className={`group relative flex min-h-[260px] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70 ${
            isDragging
              ? "border-emerald-300/80 bg-emerald-300/10"
              : "border-white/15 bg-white/5"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />

          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-52 w-full rounded-xl object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-200">
                <span className="text-xl">+</span>
              </div>
              <div className="space-y-1">
                <p className="text-base font-medium text-white">
                  Drag and drop an image here, or click to browse
                </p>
                <p className="text-sm text-slate-300">
                  JPG, PNG, WEBP. Use a clear, well-lit image for best accuracy.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={openFilePicker}
            className="rounded-full border border-emerald-300/60 px-5 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200 hover:text-emerald-50"
          >
            Choose image
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="rounded-full bg-emerald-300 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Processing..." : "Predict"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/40"
          >
            Clear
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Prediction results</h3>
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-emerald-200">
              <span className="h-2 w-2 animate-spin rounded-full border border-emerald-200 border-t-transparent" />
              Processing
            </div>
          ) : null}
        </div>

        <div className="mt-4 space-y-4" aria-live="polite">
          {result ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
                  Label
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {friendlyLabel}
                </p>
                <p className="text-sm text-slate-300">Raw label: {result.label}</p>
                {result.dangerLevel ? (
                  <p className="text-sm text-slate-300">
                    Danger level: {result.dangerLevel}
                  </p>
                ) : null}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
                  Confidence
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {confidenceText ?? "Unavailable"}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-300">
              {file ? "Click 'Predict' to run inference." : "No data yet."}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
            Endpoint
          </p>
          <p className="mt-2 break-all">{endpoint}</p>
        </div>
      </div>
    </div>
  );
}
