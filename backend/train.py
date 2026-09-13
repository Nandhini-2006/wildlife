
from ultralytics import RTDETR
import os

DATASET = "/content/animals/data.yaml"
MODEL = "rtdetr-l.pt"

model = RTDETR(MODEL)

results = model.train(
    data=DATASET,
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

print("Training completed.")
print("Best model:")
print("runs/animals_rtdetr/weights/best.pt")
