# Wildlife — RT-DETR Animal Detection System

A real-world object detection system that identifies ten animal (and human)
classes in photographs using **RT-DETR** (Real-Time Detection Transformer).
The project ships as a complete stack: a trained detection model, a Flask
inference API, and a React/TypeScript frontend — all runnable together with
a single Docker command, or individually for development.

---

## Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Model Architecture — RT-DETR](#model-architecture--rt-detr)
- [Dataset](#dataset)
- [Training Configuration](#training-configuration)
- [Evaluation Results](#evaluation-results)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Method 1 — Docker (Recommended)](#method-1--docker-recommended)
  - [Method 2 — Running Manually](#method-2--running-manually)
- [API Reference](#api-reference)
- [Model Files](#model-files)
- [Retraining and Evaluation](#retraining-and-evaluation)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Overview

Given a photograph, the system detects and localizes instances of the
following ten classes, returning a bounding box and confidence score for
each:

```
cat, chicken, cow, dog, fox, goat, horse, person, racoon, skunk
```

Several of these — fox, goat, racoon, and skunk — are **not** part of the
standard COCO class set, so the underlying model was fine-tuned on a
custom, purpose-built dataset rather than used out of the box.

The system is split into three cooperating parts:

| Component  | Responsibility                                              |
| ---------- | ------------------------------------------------------------ |
| `model/`   | The trained RT-DETR weights and dataset configuration        |
| `backend/` | A Flask API that loads the model and serves predictions      |
| `frontend/`| A React/TypeScript single-page app for uploading images and viewing results |

---

## System Architecture

```
                     ┌──────────────────────────┐
                     │        Browser           │
                     │  (React + TypeScript UI) │
                     └────────────┬─────────────┘
                                  │  [HTTP (multipart/form-data)]
                                  ▼
                     ┌───────────────────────────────────┐
                     │      Flask Backend                │
                     │   (backend/app.py)                │
                     │                                   │
                     │  1. Receive image                 │
                     │  2. Preprocess (PIL, RGB)         │
                     │  3. Run RT-DETR inference         │
                     │  4. Format detections as JSON     │
                     └────────────┬──────────────────────┘
                                  │  model.predict()
                                  ▼
                     ┌───────────────────────────┐
                     │     RT-DETR-L Model       │
                     │  (model/best.pt / .onnx)  │
                     └───────────────────────────┘
```

In the Docker deployment, Nginx serves the built frontend on port `80` and
proxies user traffic, while the Flask backend runs as a separate
container on port `5000`. The two containers are connected on the same
Docker Compose network, with the frontend calling the backend's `/predict`
endpoint directly from the browser.

---

## Model Architecture — RT-DETR

The detector is **RT-DETR-L** (Real-Time Detection Transformer, Large
variant), the first DETR-style detector shown to outperform YOLO models on
both accuracy and speed by removing the two long-standing weaknesses of
transformer detectors: high computational cost on multi-scale features and
dependence on hand-tuned query design. Its pipeline has three stages:

**1. CNN Backbone**
A convolutional backbone (HGNetv2 / ResNet-style) extracts multi-scale
feature maps from the input image at strides of 8, 16, and 32 (referred to
as S3, S4, S5). This keeps early feature extraction cheap relative to
running a transformer over raw pixels.

**2. Efficient Hybrid Encoder**
Rather than feeding all multi-scale features through a full transformer
(as in the original DETR, which is computationally expensive), RT-DETR
uses a hybrid encoder with two sub-modules:
- **AIFI (Attention-based Intra-scale Feature Interaction)** — applies
  self-attention only to the lowest-resolution, most semantically rich
  feature map (S5), capturing global context cheaply.
- **CCFM (CNN-based Cross-scale Feature Fusion Module)** — fuses
  information across the S3/S4/S5 scales using lightweight convolutional
  blocks, giving the model multi-scale awareness without the quadratic
  cost of attention at high resolution.

**3. IoU-Aware Query Selection**
Instead of using a fixed or random set of object queries (as in vanilla
DETR), RT-DETR selects a fixed number of encoder features as initial
object queries, scored jointly by classification confidence and predicted
IoU with ground truth during training. This gives the decoder
higher-quality starting points and speeds up convergence.

**Why RT-DETR for this project:**
- End-to-end detection without NMS post-processing simplifies the
  inference pipeline in `backend/inference.py`.
- Strong accuracy on small custom datasets (1,000 images) after
  fine-tuning from COCO-pretrained weights.
- Real-time inference speed suitable for a synchronous request/response
  API like the one implemented in `app.py`.

**Configuration used in this project:**

| Parameter        | Value        |
| ----------------- | ------------ |
| Base weights       | `rtdetr-l.pt` (COCO-pretrained) |
| Input resolution   | 640 × 640     |
| Number of classes  | 10            |
| Confidence threshold (inference) | 0.25 |
| Framework          | Ultralytics `RTDETR` |
| Export formats     | PyTorch (`.pt`), ONNX (`.onnx`) |

---

## Dataset

| Property        | Value                          |
| ----------------- | ------------------------------ |
| Total images       | 1,000                          |
| Training split      | 700 images                     |
| Validation split    | 200 images                     |
| Test split          | 100 images                     |
| Classes             | 10 (see below)                 |
| Annotation format   | Originally COCO, converted to YOLO format for RT-DETR training |
| License             | CC BY 4.0                      |

**Classes:** `cat`, `chicken`, `cow`, `dog`, `fox`, `goat`, `horse`,
`person`, `racoon`, `skunk`

Because `fox`, `goat`, `racoon`, and `skunk` fall outside the standard COCO
category set, this dataset was purpose-built (or curated) rather than
reused directly, then converted into YOLO-style label files referenced by
`model/data.yaml`.

The repository also includes:
- `dataset/` — the source image and annotation data used for training
- `testing_animals/` — sample images for manually exercising the trained
  model outside of the automated validation split
- `training_results/` — training curves, confusion matrices, and other
  artifacts produced by the Ultralytics training run

---

## Training Configuration

Training is defined in `backend/train.py`:

```python
model.train(
    data="/content/animals/data.yaml",
    epochs=30,
    imgsz=640,
    batch=8,
    device=0,
    workers=2,
    cache=False,
    patience=8,
    seed=42,
    project="runs",
    name="animals_rtdetr",
    pretrained=True
)
```

| Hyperparameter        | Value  |
| ----------------------- | ------ |
| Epochs                   | 30     |
| Image size               | 640    |
| Batch size                | 8      |
| Early stopping patience   | 8 epochs |
| Random seed               | 42     |
| Pretrained initialization | Yes (COCO weights) |

The resulting best checkpoint is written to
`runs/animals_rtdetr/weights/best.pt` and copied into `model/best.pt` for
serving.

---

## Evaluation Results

Computed on the held-out validation split via `backend/evaluate.py`:

| Metric     | Score |
| ----------- | ----- |
| Precision    | 0.911 |
| Recall       | 0.857 |
| mAP50        | 0.916 |
| mAP50-95     | 0.757 |

- **Precision (0.911)** — of all detections the model reports, roughly
  91% are correct, indicating a low false-positive rate.
- **Recall (0.857)** — the model finds about 86% of the actual objects
  present, meaning some instances (likely partially occluded or
  small/distant animals) are missed.
- **mAP50 (0.916)** — mean average precision at a 50% IoU threshold,
  a strong result for a 1,000-image dataset across ten classes.
- **mAP50-95 (0.757)** — mean average precision averaged over IoU
  thresholds from 0.50 to 0.95, a stricter measure of localization
  quality; a score above 0.7 indicates tight, well-fitted bounding boxes.

To reproduce these numbers or re-evaluate after retraining:

```bash
python backend/evaluate.py
```

---

## Project Structure

```
wildlife/
├── backend/
│   ├── app.py               # Flask API: /, /health, /predict
│   ├── inference.py         # Standalone inference helper (predict_image)
│   ├── train.py             # RT-DETR training script
│   ├── evaluate.py          # Validation / metrics script
│   ├── requirements.txt     # Backend-only dependencies
│   └── Dockerfile           # Backend container definition
├── frontend/
│   ├── src/                 # React + TypeScript single-page app
│   ├── package.json
│   └── Dockerfile           # Frontend container definition (Nginx-served build)
├── model/
│   ├── best.pt               # Trained RT-DETR weights (PyTorch)
│   ├── best.onnx              # Exported ONNX weights
│   └── data.yaml               # Class names and dataset paths
├── dataset/                  # Source training/validation/test images and labels
├── testing_animals/          # Sample images for manual inference checks
├── training_results/         # Training curves, metrics, and plots
├── docker-compose.yml        # Orchestrates backend + frontend containers
├── requirements.txt          # Root-level Python dependencies
├── .gitignore
└── README.md
```

---

## Tech Stack

| Layer               | Technology                             |
| -------------------- | --------------------------------------- |
| Detection model        | RT-DETR-L (Ultralytics implementation) |
| Model export formats    | PyTorch (`.pt`), ONNX (`.onnx`)        |
| Backend framework       | Flask                                  |
| Backend CORS            | flask-cors                             |
| Image handling           | Pillow                                 |
| Frontend framework       | React 19 + TypeScript                  |
| Frontend build tool       | Vite                                    |
| Frontend icons            | lucide-react                            |
| Production web server      | Nginx (serving the built frontend)     |
| Containerization             | Docker & Docker Compose                |

---

## Getting Started

### Method 1 — Docker (Recommended)

This builds and runs both the backend and frontend with a single command.

Open a terminal in the project root and run:

```bash
docker-compose up -d --build
```

The `-d` flag runs the stack in detached mode, so it keeps running after
you close the terminal. To stop it later:

```bash
docker-compose down
```

Once the build finishes, open your browser to:

```
http://localhost
```

The frontend (served by Nginx on port 80) communicates with the backend
container (Flask on port 5000) automatically within the Docker network.

### Method 2 — Running Manually

Requires two terminals: one for the backend, one for the frontend.

**Terminal 1 — Backend**

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # on macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python app.py
```

The backend API will be running at `http://localhost:5000`.

**Terminal 2 — Frontend**

```bash
cd frontend
npm install
npm run dev
```

The terminal will print a local URL (typically `http://localhost:5173`).
Open it in your browser to use the app.

> When running the frontend in dev mode against a manually started
> backend, confirm `VITE_API_BASE_URL` in `frontend/.env` points to
> `http://localhost:5000`.

---

## API Reference

All endpoints are defined in `backend/app.py`.

### `GET /`

Basic liveness check.

```json
{
  "message": "RT-DETR Animal Detection API",
  "status": "running"
}
```

### `GET /health`

Confirms the model has loaded and lists its classes.

```json
{
  "status": "healthy",
  "model": "RT-DETR",
  "classes": {
    "0": "cat",
    "1": "chicken",
    "2": "cow",
    "3": "dog",
    "4": "fox",
    "5": "goat",
    "6": "horse",
    "7": "person",
    "8": "racoon",
    "9": "skunk"
  }
}
```

### `POST /predict`

Runs detection on an uploaded image.

**Request**
```
Content-Type: multipart/form-data
image: <file>
```

**Response — success**
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

**Response — error**
```json
{
  "success": false,
  "error": "No image uploaded"
}
```

Errors are returned with an appropriate HTTP status code (`400` for a
missing or empty file, `500` for an inference failure).

---

## Model Files

| File               | Purpose                                         |
| -------------------- | ------------------------------------------------ |
| `model/best.pt`        | Trained RT-DETR weights, used by the Flask backend |
| `model/best.onnx`       | ONNX export, for deployment outside PyTorch/Ultralytics |
| `model/data.yaml`        | Class name mapping and dataset path configuration |

---

## Retraining and Evaluation

To retrain the model on an updated dataset:

```bash
python backend/train.py
```

Update the `DATASET` path in `train.py` to point at your `data.yaml`
before running. The best checkpoint from training should be copied to
`model/best.pt` to be picked up by the backend.

To validate a trained checkpoint:

```bash
python backend/evaluate.py
```

This prints precision, recall, mAP50, and mAP50-95 on the validation
split, matching the metrics reported above.

---

## Troubleshooting

**Frontend shows "Service unavailable"**
Confirm the backend container or process is running and reachable at the
address configured in the frontend's environment (`VITE_API_BASE_URL`).
CORS is already enabled in `backend/app.py` via `flask-cors`, so this is
usually a networking or port mismatch rather than a CORS issue.

**`docker-compose up` fails to build the backend image**
Ensure Docker has enough memory allocated; installing `ultralytics` and
its dependencies (including PyTorch) is memory-intensive during the
image build.

**Predictions are empty for an image that clearly contains an animal**
The default confidence threshold is `0.25`. Very small, distant, or
heavily occluded subjects may fall below this threshold. Adjust `conf` in
`backend/app.py` or `backend/inference.py` if needed.

**Port `80` or `5000` already in use**
Stop any other service bound to those ports, or edit the port mappings in
`docker-compose.yml` (for example `"8080:80"` for the frontend).

---

## License

The dataset is distributed under **CC BY 4.0**. Refer to individual
component directories for any additional licensing terms.
