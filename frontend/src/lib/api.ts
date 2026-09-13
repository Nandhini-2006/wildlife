import type { HealthResponse, PredictResponse } from "../types/detection";

// Base URL of the Flask backend. Override at build time with
// VITE_API_BASE_URL, or at runtime by editing the .env file.
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:5000";

async function parseJsonSafely(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text || response.statusText };
  }
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: "GET",
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(data.error || "Unable to reach the detection service.");
  }

  return data as HealthResponse;
}

export async function predictImage(file: File): Promise<PredictResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  const data = await parseJsonSafely(response);

  if (!response.ok || data.success === false) {
    throw new Error(data.error || "The detection request failed.");
  }

  return data as PredictResponse;
}
