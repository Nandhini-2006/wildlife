import { ClipboardList, PawPrint } from "lucide-react";
import type { Detection } from "../types/detection";

interface ResultsPanelProps {
  detections: Detection[];
  onHover: (index: number | null) => void;
  highlightedIndex: number | null;
}

export default function ResultsPanel({
  detections,
  onHover,
  highlightedIndex,
}: ResultsPanelProps) {
  return (
    <div className="results-panel">
      <div className="results-panel__heading">
        <ClipboardList size={18} strokeWidth={1.5} />
        <h2>Detection Results</h2>
        <span className="results-panel__count">{detections.length}</span>
      </div>

      {detections.length === 0 ? (
        <div className="results-panel__empty">
          <PawPrint size={22} strokeWidth={1.25} />
          <p>No objects were detected in this image.</p>
        </div>
      ) : (
        <table className="results-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Class</th>
              <th>Confidence</th>
              <th>Bounding Box</th>
            </tr>
          </thead>
          <tbody>
            {detections.map((detection, index) => (
              <tr
                key={`${detection.class_id}-${index}`}
                className={highlightedIndex === index ? "is-highlighted" : ""}
                onMouseEnter={() => onHover(index)}
                onMouseLeave={() => onHover(null)}
              >
                <td>{index + 1}</td>
                <td className="results-table__class">{detection.class_name}</td>
                <td>{(detection.confidence * 100).toFixed(1)}%</td>
                <td className="results-table__bbox">
                  ({Math.round(detection.bbox.x1)}, {Math.round(detection.bbox.y1)}) &ndash; (
                  {Math.round(detection.bbox.x2)}, {Math.round(detection.bbox.y2)})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
