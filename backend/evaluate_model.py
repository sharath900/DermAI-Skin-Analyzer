"""Evaluate DermAI's trained checkpoint on a labeled, held-out image folder.

Expected layout:
    test_images/
      MEL/ image files...
      NEV/ image files...
      BCC/ image files...
      ACK/ image files...
      SEK/ image files...
      SCC/ image files...

The folder names are the ground-truth labels. This script reports test-set
metrics only; it does not train the model or establish clinical validity.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import torch
from PIL import Image, UnidentifiedImageError
from torch import nn
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms

CLASS_CODES = ["MEL", "NEV", "BCC", "ACK", "SEK", "SCC"]
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
IMAGE_TRANSFORM = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ]
)


class LabeledImageFolder(Dataset):
    """Load images from subfolders named with the model's class codes."""

    def __init__(self, root: Path):
        self.samples: list[tuple[Path, int]] = []
        for class_index, class_code in enumerate(CLASS_CODES):
            class_dir = root / class_code
            if class_dir.is_dir():
                self.samples.extend(
                    (path, class_index)
                    for path in sorted(class_dir.rglob("*"))
                    if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
                )
        if not self.samples:
            expected = ", ".join(CLASS_CODES)
            raise ValueError(
                f"No supported images found under {root}. Add class subfolders: {expected}."
            )

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, index: int):
        path, target = self.samples[index]
        try:
            with Image.open(path) as image:
                tensor = IMAGE_TRANSFORM(image.convert("RGB"))
        except (OSError, UnidentifiedImageError) as exc:
            raise RuntimeError(f"Could not read image: {path}") from exc
        return tensor, target, str(path)


def load_model(checkpoint_path: Path, device: torch.device) -> nn.Module:
    model = models.mobilenet_v3_large(weights=None)
    model.classifier[-1] = nn.Linear(model.classifier[-1].in_features, len(CLASS_CODES))
    state_dict = torch.load(str(checkpoint_path), map_location=device)
    model.load_state_dict(state_dict)
    return model.to(device).eval()


def calculate_metrics(matrix: np.ndarray) -> dict:
    support = matrix.sum(axis=1)
    predicted = matrix.sum(axis=0)
    true_positive = np.diag(matrix)
    precision = np.divide(
        true_positive, predicted, out=np.zeros(len(CLASS_CODES), dtype=float), where=predicted != 0
    )
    recall = np.divide(
        true_positive, support, out=np.zeros(len(CLASS_CODES), dtype=float), where=support != 0
    )
    f1 = np.divide(
        2 * precision * recall,
        precision + recall,
        out=np.zeros(len(CLASS_CODES), dtype=float),
        where=(precision + recall) != 0,
    )
    total = int(matrix.sum())
    included = support > 0
    return {
        "class_order": CLASS_CODES,
        "num_images": total,
        "accuracy": float(true_positive.sum() / total) if total else 0.0,
        "macro_precision_present_classes": float(precision[included].mean()) if included.any() else 0.0,
        "macro_recall_present_classes": float(recall[included].mean()) if included.any() else 0.0,
        "macro_f1_present_classes": float(f1[included].mean()) if included.any() else 0.0,
        "per_class": {
            code: {
                "precision": float(precision[index]),
                "recall": float(recall[index]),
                "f1": float(f1[index]),
                "support": int(support[index]),
            }
            for index, code in enumerate(CLASS_CODES)
        },
    }


def save_confusion_matrix(matrix: np.ndarray, output_path: Path) -> None:
    row_totals = matrix.sum(axis=1, keepdims=True)
    row_percent = np.divide(
        matrix,
        row_totals,
        out=np.zeros_like(matrix, dtype=float),
        where=row_totals != 0,
    )
    fig, ax = plt.subplots(figsize=(9, 7))
    image = ax.imshow(matrix, cmap="Blues")
    ax.set(
        xticks=np.arange(len(CLASS_CODES)),
        yticks=np.arange(len(CLASS_CODES)),
        xticklabels=CLASS_CODES,
        yticklabels=CLASS_CODES,
        xlabel="Predicted label",
        ylabel="True label",
        title="DermAI held-out test confusion matrix\n(count; row-normalized percentage)",
    )
    plt.setp(ax.get_xticklabels(), rotation=35, ha="right", rotation_mode="anchor")
    threshold = matrix.max() / 2 if matrix.size else 0
    for row in range(len(CLASS_CODES)):
        for column in range(len(CLASS_CODES)):
            ax.text(
                column,
                row,
                f"{matrix[row, column]}\n{row_percent[row, column]:.0%}",
                ha="center",
                va="center",
                color="white" if matrix[row, column] > threshold else "black",
                fontsize=9,
            )
    fig.colorbar(image, ax=ax, label="Image count")
    fig.tight_layout()
    fig.savefig(output_path, dpi=200, bbox_inches="tight")
    plt.close(fig)


def save_class_distribution(matrix: np.ndarray, output_path: Path) -> None:
    counts = matrix.sum(axis=1)
    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.bar(CLASS_CODES, counts, color="#2a9d8f")
    ax.bar_label(bars, padding=3)
    ax.set(title="Ground-truth class counts in evaluation set", xlabel="Class", ylabel="Images")
    ax.set_ylim(0, max(1, int(counts.max()) * 1.15))
    fig.tight_layout()
    fig.savefig(output_path, dpi=200, bbox_inches="tight")
    plt.close(fig)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Evaluate the DermAI checkpoint and plot a confusion matrix."
    )
    parser.add_argument("--data-dir", required=True, type=Path, help="Held-out class-folder dataset")
    parser.add_argument(
        "--checkpoint",
        type=Path,
        default=Path(__file__).resolve().parent / "ml_models" / "best_model.pth",
        help="Model state-dict path (default: backend/ml_models/best_model.pth)",
    )
    parser.add_argument("--output-dir", type=Path, default=Path("evaluation_output"))
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--device", choices=["auto", "cpu", "cuda"], default="auto")
    args = parser.parse_args()

    if args.batch_size < 1:
        parser.error("--batch-size must be at least 1")
    if not args.data_dir.is_dir():
        parser.error(f"Evaluation directory does not exist: {args.data_dir}")
    if not args.checkpoint.is_file():
        parser.error(f"Model checkpoint does not exist: {args.checkpoint}")
    if args.device == "cuda" and not torch.cuda.is_available():
        parser.error("CUDA was requested but is not available")

    device = torch.device(
        "cuda" if args.device == "cuda" or (args.device == "auto" and torch.cuda.is_available()) else "cpu"
    )
    dataset = LabeledImageFolder(args.data_dir)
    loader = DataLoader(dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)
    model = load_model(args.checkpoint, device)
    matrix = np.zeros((len(CLASS_CODES), len(CLASS_CODES)), dtype=np.int64)
    records: list[tuple[str, str, str]] = []

    with torch.inference_mode():
        for images, targets, paths in loader:
            outputs = model(images.to(device))
            predictions = outputs.argmax(dim=1).cpu().numpy()
            targets_np = targets.numpy()
            np.add.at(matrix, (targets_np, predictions), 1)
            records.extend(
                (path, CLASS_CODES[int(target)], CLASS_CODES[int(prediction)])
                for path, target, prediction in zip(paths, targets_np, predictions)
            )

    args.output_dir.mkdir(parents=True, exist_ok=True)
    save_confusion_matrix(matrix, args.output_dir / "confusion_matrix.png")
    save_class_distribution(matrix, args.output_dir / "class_distribution.png")
    metrics = calculate_metrics(matrix)
    metrics["evaluation_directory"] = str(args.data_dir)
    metrics["checkpoint"] = str(args.checkpoint)
    metrics["device"] = str(device)
    (args.output_dir / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    with (args.output_dir / "predictions.csv").open("w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["image_path", "true_label", "predicted_label"])
        writer.writerows(records)

    print(f"Evaluated {metrics['num_images']} images on {device}.")
    print(f"Accuracy: {metrics['accuracy']:.4f}")
    print(f"Outputs written to: {args.output_dir.resolve()}")


if __name__ == "__main__":
    main()
