
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import RTDETR
from PIL import Image
import os
import tempfile

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "model",
    "best.pt"
)

model = RTDETR(MODEL_PATH)

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "RT-DETR Animal Detection API",
        "status": "running"
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "model": "RT-DETR",
        "classes": model.names
    })


@app.route("/predict", methods=["POST"])
def predict():

    if "image" not in request.files:
        return jsonify({
            "error": "No image uploaded"
        }), 400

    image_file = request.files["image"]

    if image_file.filename == "":
        return jsonify({
            "error": "Empty filename"
        }), 400

    try:
        image = Image.open(image_file.stream).convert("RGB")

        results = model.predict(
            source=image,
            imgsz=640,
            conf=0.25,
            verbose=False
        )

        detections = []

        for result in results:

            boxes = result.boxes

            for box in boxes:

                class_id = int(box.cls[0])
                confidence = float(box.conf[0])

                x1, y1, x2, y2 = map(
                    float,
                    box.xyxy[0].tolist()
                )

                detections.append({
                    "class_id": class_id,
                    "class_name": model.names[class_id],
                    "confidence": round(confidence, 4),
                    "bbox": {
                        "x1": round(x1, 2),
                        "y1": round(y1, 2),
                        "x2": round(x2, 2),
                        "y2": round(y2, 2)
                    }
                })

        return jsonify({
            "success": True,
            "count": len(detections),
            "detections": detections
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )
