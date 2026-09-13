
from ultralytics import RTDETR
from PIL import Image
import os

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "model",
    "best.pt"
)

model = RTDETR(MODEL_PATH)

def predict_image(image_path, confidence=0.25):
    """
    Run RT-DETR object detection on an image.

    Returns:
        list of detections containing:
        class_id, class_name, confidence, bbox
    """

    image = Image.open(image_path).convert("RGB")

    results = model.predict(
        source=image,
        imgsz=640,
        conf=confidence,
        verbose=False
    )

    detections = []

    for result in results:
        for box in result.boxes:

            class_id = int(box.cls[0])
            confidence_score = float(box.conf[0])

            x1, y1, x2, y2 = map(
                float,
                box.xyxy[0].tolist()
            )

            detections.append({
                "class_id": class_id,
                "class_name": model.names[class_id],
                "confidence": round(confidence_score, 4),
                "bbox": [
                    round(x1, 2),
                    round(y1, 2),
                    round(x2, 2),
                    round(y2, 2)
                ]
            })

    return detections


if __name__ == "__main__":
    print("RT-DETR model loaded successfully")
    print("Classes:")
    
    for class_id, class_name in model.names.items():
        print(f"{class_id}: {class_name}")
