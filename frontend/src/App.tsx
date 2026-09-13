import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, LoaderCircle, RefreshCcw, Send } from "lucide-react";
import Header from "./components/Header";
import ImageUploader from "./components/ImageUploader";
import DetectionCanvas from "./components/DetectionCanvas";
import ResultsPanel from "./components/ResultsPanel";
import ReasoningBox from "./components/ReasoningBox";
import { fetchHealth, predictImage } from "./lib/api";
import { buildReasoning } from "./lib/reasoning";
import type { ApiStatus, Detection } from "./types/detection";
import "./App.css";

export default function App() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [modelName, setModelName] = useState<string | undefined>(undefined);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchHealth()
      .then((health) => {
        if (!isMounted) return;
        setApiStatus("online");
        setModelName(health.model);
      })
      .catch(() => {
        if (!isMounted) return;
        setApiStatus("offline");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const handleFileSelected = (file: File) => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setSelectedFile(file);
    setImageUrl(URL.createObjectURL(file));
    setDetections([]);
    setHasRun(false);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await predictImage(selectedFile);
      setDetections(result.detections);
      setHasRun(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setSelectedFile(null);
    setImageUrl(null);
    setDetections([]);
    setHighlightedIndex(null);
    setHasRun(false);
    setErrorMessage(null);
  };

  const submitLabel = useMemo(() => {
    if (isSubmitting) return "Analyzing";
    if (hasRun) return "Re-run Detection";
    return "Run Detection";
  }, [isSubmitting, hasRun]);

  const reasoningText = useMemo(
    () => buildReasoning(detections, hasRun),
    [detections, hasRun]
  );

  return (
    <div className="app">
      <Header status={apiStatus} modelName={modelName} />

      <main className="app__content">
        <section className="panel panel--input">
          <div className="panel__heading">
            <h2>Source Image</h2>
            <p>Upload a photograph to identify animals within the frame.</p>
          </div>

          {!imageUrl ? (
            <ImageUploader onFileSelected={handleFileSelected} disabled={isSubmitting} />
          ) : (
            <DetectionCanvas
              imageUrl={imageUrl}
              detections={detections}
              highlightedIndex={highlightedIndex}
            />
          )}

          <div className="panel__actions">
            <button
              type="button"
              className="button button--primary"
              onClick={handleSubmit}
              disabled={!selectedFile || isSubmitting || apiStatus === "offline"}
            >
              {isSubmitting ? (
                <LoaderCircle size={16} strokeWidth={2} className="button__icon--spin" />
              ) : (
                <Send size={16} strokeWidth={2} />
              )}
              {submitLabel}
            </button>

            <button
              type="button"
              className="button button--secondary"
              onClick={handleReset}
              disabled={!selectedFile || isSubmitting}
            >
              <RefreshCcw size={16} strokeWidth={2} />
              Clear
            </button>
          </div>

          {errorMessage && (
            <div className="alert">
              <AlertTriangle size={16} strokeWidth={2} />
              <span>{errorMessage}</span>
            </div>
          )}

          {apiStatus === "offline" && (
            <div className="alert">
              <AlertTriangle size={16} strokeWidth={2} />
              <span>
                The detection service could not be reached. Confirm the backend is running
                and the API address is configured correctly.
              </span>
            </div>
          )}
        </section>

        <section className="panel panel--results">
          <div className="panel__heading">
            <h2>Analysis</h2>
            <p>Bounding boxes and confidence scores returned by the model.</p>
          </div>

          <ReasoningBox text={reasoningText} />

          <ResultsPanel
            detections={detections}
            onHover={setHighlightedIndex}
            highlightedIndex={highlightedIndex}
          />
        </section>
      </main>

      <footer className="app__footer">
        <span>Animal Detection Console</span>
        <span>RT&#8209;DETR Inference Frontend</span>
      </footer>
    </div>
  );
}
