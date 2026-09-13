# RT-DETR Animal Detection

Real-world object detection system built using RT-DETR and a custom 1,000-image animal dataset.

## Model

- Architecture: RT-DETR-L
- Task: Object Detection
- Image size: 640x640
- Classes: 10
- Training: 30 epochs
- Dataset: 1,000 images
- Train: 700 images
- Validation: 200 images
- Test: 100 images

## Classes

cat, chicken, cow, dog, fox, goat, horse, person, racoon, skunk

The dataset contains non-COCO classes such as fox, goat, racoon and skunk.

## Test Results

| Metric | Score |
|---|---:|
| Precision | 0.911 |
| Recall | 0.857 |
| mAP50 | 0.916 |
| mAP50-95 | 0.757 |

## Model Files

- `model/best.pt` - trained RT-DETR model
- `model/best.onnx` - ONNX model
- `model/data.yaml` - dataset configuration

## Backend

Flask backend providing object detection through the `/predict` endpoint.

### Run

```bash
pip install -r requirements.txt
python backend/app.py
```

### API Endpoints

- `GET /` - API status
- `GET /health` - health check
- `POST /predict` - upload an image and receive detections

## Project Structure

```text
Classifier/
├── backend/
│   ├── app.py
│   ├── inference.py
│   ├── train.py
│   ├── evaluate.py
│   └── requirements.txt
├── model/
│   ├── best.pt
│   ├── best.onnx
│   └── data.yaml
├── requirements.txt
├── .gitignore
└── README.md
```

## Dataset

Dataset size: 1,000 images.

License: CC BY 4.0.

COCO annotations were converted to YOLO format for RT-DETR training.
