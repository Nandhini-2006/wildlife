export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Detection {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface PredictResponse {
  success: boolean;
  count: number;
  detections: Detection[];
  error?: string;
}

export interface HealthResponse {
  status: string;
  model: string;
  classes: Record<string, string>;
}

export type ApiStatus = "checking" | "online" | "offline";
