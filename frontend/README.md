# Animal Detection Console

A single-page React + TypeScript frontend for the RT-DETR Animal Detection
Flask backend (`Nandhini-2006/Classifier`). Upload an image, run detection,
and review bounding boxes and confidence scores in a clean, black-and-white,
print-style interface set in Times New Roman.

This package contains the **frontend only**. It does not include or modify
the Flask backend.

## Backend Endpoints Used

| Method | Path       | Purpose                                             |
| ------ | ---------- | ---------------------------------------------------- |
| GET    | `/health`  | Confirms the service is reachable and lists classes  |
| POST   | `/predict` | Accepts `multipart/form-data` with an `image` field and returns detections |

Expected `/predict` response shape:

```json
{
  "success": true,
  "count": 2,
  "detections": [
    {
      "class_id": 3,
      "class_name": "dog",
      "confidence": 0.93,
      "bbox": { "x1": 12.4, "y1": 40.1, "x2": 210.0, "y2": 320.5 }
    }
  ]
}
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the backend address

Copy the example environment file and point it at your running Flask
backend:

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_API_BASE_URL=http://localhost:5000
```

### 3. Run the backend

In a separate terminal, from the `Classifier` repository:

```bash
pip install -r requirements.txt
python backend/app.py
```

The Flask API listens on `http://localhost:5000` by default.

### 4. Run the frontend

```bash
npm run dev
```

Open the printed local URL in your browser (typically
`http://localhost:5173`).

### 5. Production build

```bash
npm run build
npm run preview
```

The optimized static files are written to `dist/`.

## Project Structure

```
animal-detector-frontend/
├── src/
│   ├── components/
│   │   ├── Header.tsx            # Title bar and live service status
│   │   ├── ImageUploader.tsx     # Drag-and-drop / click-to-browse upload
│   │   ├── DetectionCanvas.tsx   # Draws the image with bounding box overlays
│   │   ├── ReasoningBox.tsx      # Plain-language summary of the detection results
│   │   └── ResultsPanel.tsx      # Tabular list of detections
│   ├── lib/
│   │   ├── api.ts                # fetch wrappers for /health and /predict
│   │   └── reasoning.ts          # Builds the reasoning summary from detections
│   ├── types/
│   │   └── detection.ts          # Shared TypeScript interfaces
│   ├── App.tsx                   # Page composition and state
│   ├── App.css                   # Layout and component styling
│   └── index.css                 # Global reset and typography
├── .env.example
├── index.html
└── package.json
```

## Notes

- If the backend's CORS policy blocks browser requests, enable
  `flask-cors` on the Flask app (`CORS(app)`), since this frontend calls the
  API directly from the browser.
- The interface shows a live "Service online / unavailable" indicator in
  the header based on a call to `/health` on load.
- Bounding boxes are rendered on an HTML canvas sized to the image's
  natural resolution, so coordinates from the backend map directly without
  additional scaling logic.
- The **Reasoning** box is generated on the frontend from the detection
  results (object counts, top confidence, average confidence, and
  low-confidence flags). The Flask backend does not currently return a
  reasoning or explanation field, so this summary is computed client-side
  in `src/lib/reasoning.ts`. If the backend is later extended to return an
  explanation string, that function can be replaced with a direct pass-through.
