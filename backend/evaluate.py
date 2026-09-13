
from ultralytics import RTDETR
import os

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "model",
    "best.pt"
)

DATASET = "/content/animals/data.yaml"

model = RTDETR(MODEL_PATH)

print("Running validation...")

results = model.val(
    data=DATASET,
    split="val",
    imgsz=640,
    batch=8,
    device=0,
    workers=2,
    cache=False,
    plots=True
)

print("\nValidation Results")
print("------------------")
print(f"Precision : {results.box.mp:.4f}")
print(f"Recall    : {results.box.mr:.4f}")
print(f"mAP50     : {results.box.map50:.4f}")
print(f"mAP50-95  : {results.box.map:.4f}")

print("\nEvaluation completed.")
