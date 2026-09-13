import type { Detection } from "../types/detection";

const HIGH_CONFIDENCE = 0.75;
const LOW_CONFIDENCE = 0.4;

export function buildReasoning(detections: Detection[], hasRun: boolean): string {
  if (!hasRun) {
    return "Run a detection to see the model's reasoning about the uploaded image.";
  }

  if (detections.length === 0) {
    return "No objects met the detection threshold. This may indicate the image does not " +
      "contain any of the model's known classes, or that the subject is too small, " +
      "obscured, or low-contrast for confident identification.";
  }

  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const top = sorted[0];

  const counts = new Map<string, number>();
  detections.forEach((detection) => {
    counts.set(detection.class_name, (counts.get(detection.class_name) ?? 0) + 1);
  });

  const classSummary = Array.from(counts.entries())
    .map(([name, count]) => (count > 1 ? `${count} ${name}s` : `1 ${name}`))
    .join(", ");

  const averageConfidence =
    detections.reduce((sum, detection) => sum + detection.confidence, 0) / detections.length;

  const lowConfidenceCount = detections.filter((d) => d.confidence < LOW_CONFIDENCE).length;

  const sentences: string[] = [];

  sentences.push(
    detections.length === 1
      ? `The model identified one object in the frame: ${classSummary}.`
      : `The model identified ${detections.length} objects in the frame: ${classSummary}.`
  );

  sentences.push(
    top.confidence >= HIGH_CONFIDENCE
      ? `The strongest match is "${top.class_name}" at ${(top.confidence * 100).toFixed(
          1
        )}% confidence, indicating the visual features closely align with this class.`
      : `The strongest match is "${top.class_name}" at ${(top.confidence * 100).toFixed(
          1
        )}% confidence, which is moderate; the subject may be partially visible, at a distance, or share features with another class.`
  );

  sentences.push(
    `Average confidence across all detections is ${(averageConfidence * 100).toFixed(1)}%.`
  );

  if (lowConfidenceCount > 0) {
    sentences.push(
      `${lowConfidenceCount} of ${detections.length} detection${
        detections.length > 1 ? "s fall" : " falls"
      } below ${(LOW_CONFIDENCE * 100).toFixed(0)}% confidence and warrant manual review before being treated as reliable.`
    );
  }

  return sentences.join(" ");
}
