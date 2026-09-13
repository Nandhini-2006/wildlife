import { useEffect, useRef } from "react";
import type { Detection } from "../types/detection";

interface DetectionCanvasProps {
  imageUrl: string;
  detections: Detection[];
  highlightedIndex: number | null;
}

export default function DetectionCanvas({
  imageUrl,
  detections,
  highlightedIndex,
}: DetectionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !image.complete) return;

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const baseLineWidth = Math.max(2, Math.round(canvas.width / 400));
    const fontSize = Math.max(14, Math.round(canvas.width / 55));

    detections.forEach((detection, index) => {
      const { x1, y1, x2, y2 } = detection.bbox;
      const isHighlighted = index === highlightedIndex;

      context.lineWidth = isHighlighted ? baseLineWidth + 2 : baseLineWidth;
      context.strokeStyle = "#0a0a0a";
      context.strokeRect(x1, y1, x2 - x1, y2 - y1);

      const label = `${detection.class_name}  ${(detection.confidence * 100).toFixed(1)}%`;
      context.font = `${fontSize}px "Times New Roman", Times, serif`;
      const textWidth = context.measureText(label).width;
      const textPadding = 6;
      const labelHeight = fontSize + textPadding * 2;

      context.fillStyle = isHighlighted ? "#0a0a0a" : "#ffffff";
      context.fillRect(
        x1,
        Math.max(0, y1 - labelHeight),
        textWidth + textPadding * 2,
        labelHeight
      );

      context.strokeStyle = "#0a0a0a";
      context.lineWidth = 1;
      context.strokeRect(
        x1,
        Math.max(0, y1 - labelHeight),
        textWidth + textPadding * 2,
        labelHeight
      );

      context.fillStyle = isHighlighted ? "#ffffff" : "#0a0a0a";
      context.fillText(label, x1 + textPadding, Math.max(fontSize, y1 - textPadding));
    });
  };

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, detections, highlightedIndex]);

  return (
    <div className="canvas-frame">
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Uploaded source"
        className="canvas-frame__source"
        onLoad={draw}
      />
      <canvas ref={canvasRef} className="canvas-frame__canvas" />
    </div>
  );
}
