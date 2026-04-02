import hashlib
import json
import os
import random
import tempfile
import time
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import keras
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, precision_score, recall_score
from keras.src.legacy.preprocessing.image import ImageDataGenerator


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "spectrogram_dataset"
MODEL_CANDIDATES = [
    ROOT / "ml_services" / "drum_cnn_model.keras",
    ROOT / "notebooks" / "drum_cnn_model.h5",
]


def find_model_path() -> Path:
    for path in MODEL_CANDIDATES:
        if path.exists():
            return path
    raise FileNotFoundError("CNN model file not found in expected locations.")


def evaluate_cnn(model_path: Path):
    datagen = ImageDataGenerator(rescale=1.0 / 255.0, validation_split=0.2)
    val_ds = datagen.flow_from_directory(
        str(DATA_DIR),
        target_size=(128, 128),
        batch_size=32,
        class_mode="sparse",
        subset="validation",
        seed=123,
        shuffle=False,
    )

    model = keras.models.load_model(str(model_path))
    probs = model.predict(val_ds, verbose=0)
    y_pred = np.argmax(probs, axis=1)
    y_true = val_ds.classes

    class_indices = val_ds.class_indices
    idx_to_class = {idx: cls for cls, idx in class_indices.items()}
    labels = [idx_to_class[i] for i in sorted(idx_to_class.keys())]

    acc = accuracy_score(y_true, y_pred)
    precision_w = precision_score(y_true, y_pred, average="weighted", zero_division=0)
    recall_w = recall_score(y_true, y_pred, average="weighted", zero_division=0)
    f1_w = f1_score(y_true, y_pred, average="weighted", zero_division=0)
    cm = confusion_matrix(y_true, y_pred)

    report = classification_report(y_true, y_pred, target_names=labels, output_dict=True, zero_division=0)

    return {
        "model_path": str(model_path),
        "labels": labels,
        "class_indices": class_indices,
        "num_validation_samples": int(len(y_true)),
        "overall": {
            "accuracy": float(acc),
            "precision_weighted": float(precision_w),
            "recall_weighted": float(recall_w),
            "f1_weighted": float(f1_w),
        },
        "confusion_matrix": cm.tolist(),
        "classification_report": report,
    }


def create_charts(metrics: dict):
    sns.set_theme(style="whitegrid", context="talk")

    labels = metrics["labels"]
    overall = metrics["overall"]
    cm = np.array(metrics["confusion_matrix"])
    report = metrics["classification_report"]

    # Chart 1: confusion matrix heatmap
    plt.figure(figsize=(8, 6))
    ax = sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="YlGnBu",
        xticklabels=labels,
        yticklabels=labels,
        cbar=True,
        linewidths=0.5,
        linecolor="white",
    )
    ax.set_title("CNN Confusion Matrix (Validation Set)", pad=16)
    ax.set_xlabel("Predicted Label")
    ax.set_ylabel("Actual Label")
    plt.tight_layout()
    cm_path = ROOT / "cnn_confusion_matrix.png"
    plt.savefig(cm_path, dpi=200)
    plt.close()

    # Chart 2: overall and per-class metric bars
    plt.figure(figsize=(10, 6))
    names = ["Accuracy", "Precision", "Recall", "F1"]
    values = [
        overall["accuracy"],
        overall["precision_weighted"],
        overall["recall_weighted"],
        overall["f1_weighted"],
    ]
    palette = ["#26547C", "#EF476F", "#06D6A0", "#FFD166"]
    bars = plt.bar(names, values, color=palette)
    plt.ylim(0, 1.0)
    plt.ylabel("Score")
    plt.title("CNN Overall Metrics (Validation Set)", pad=16)
    for bar, val in zip(bars, values):
        plt.text(bar.get_x() + bar.get_width() / 2, val + 0.02, f"{val:.3f}", ha="center", va="bottom", fontsize=11)
    plt.tight_layout()
    metrics_path = ROOT / "cnn_metrics_overview.png"
    plt.savefig(metrics_path, dpi=200)
    plt.close()

    # Chart 3: per-class precision/recall/f1
    classes = labels
    precision_vals = [report[c]["precision"] for c in classes]
    recall_vals = [report[c]["recall"] for c in classes]
    f1_vals = [report[c]["f1-score"] for c in classes]

    x = np.arange(len(classes))
    width = 0.24
    plt.figure(figsize=(11, 6))
    plt.bar(x - width, precision_vals, width, label="Precision", color="#118AB2")
    plt.bar(x, recall_vals, width, label="Recall", color="#06D6A0")
    plt.bar(x + width, f1_vals, width, label="F1-score", color="#FFD166")
    plt.xticks(x, classes)
    plt.ylim(0, 1.0)
    plt.ylabel("Score")
    plt.title("CNN Per-Class Metrics", pad=16)
    plt.legend()
    plt.tight_layout()
    class_path = ROOT / "cnn_per_class_metrics.png"
    plt.savefig(class_path, dpi=200)
    plt.close()

    return {
        "confusion_matrix_chart": str(cm_path),
        "metrics_chart": str(metrics_path),
        "per_class_chart": str(class_path),
    }


def sha256_of_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def benchmark_hashing_vs_no_hash() -> dict:
    # Choose a real audio file from drum_dataset
    candidates = list((ROOT / "drum_dataset").rglob("*.wav")) + list((ROOT / "drum_dataset").rglob("*.mp3"))
    if not candidates:
        raise FileNotFoundError("No audio samples found under drum_dataset for benchmark.")

    random.seed(42)
    audio_path = random.choice(candidates)
    blob = audio_path.read_bytes()

    # Simulated pipeline timings based on real operations we can measure:
    # - hash computation + cache lookup
    # - model call + midi generation placeholder cost (measured as sleep from observed flow)
    # We will measure the model-path latency by invoking the ML service endpoint equivalent cost proxy.

    # Measure hash-only cost (repeat and average)
    hash_times = []
    lookup_times = []
    cache = {}
    iterations = 30

    for _ in range(iterations):
        t0 = time.perf_counter()
        file_hash = hashlib.sha256(blob).hexdigest()
        t1 = time.perf_counter()
        _ = cache.get(file_hash)
        t2 = time.perf_counter()
        hash_times.append((t1 - t0) * 1000)
        lookup_times.append((t2 - t1) * 1000)

    avg_hash_ms = float(np.mean(hash_times))
    avg_lookup_ms = float(np.mean(lookup_times))

    # Measure full model pipeline cost using composer once per request (no cache)
    # Reusing the same process approximates API behavior where model is already loaded.
    from ml_services.composer import RhythmComposer

    composer = RhythmComposer(model_path="drum_cnn_model.keras")
    if composer.model is None:
        raise RuntimeError("Could not load CNN model for benchmark.")

    no_cache_runs = 5
    no_cache_times = []
    for _ in range(no_cache_runs):
        out_path = ROOT / f"_bench_{time.time_ns()}.mid"
        t0 = time.perf_counter()
        composer.generate_bassline(str(audio_path), str(out_path))
        t1 = time.perf_counter()
        no_cache_times.append((t1 - t0) * 1000)
        if out_path.exists():
            out_path.unlink()

    avg_no_cache_ms = float(np.mean(no_cache_times))

    # Cache-hit request cost: hash + lookup + return reference (no model invocation)
    # Seed cache with one result key and time repeated lookups.
    key = sha256_of_file(audio_path)
    cache[key] = {"midi": "cached_result.mid"}

    hit_runs = 100
    hit_times = []
    for _ in range(hit_runs):
        t0 = time.perf_counter()
        k = hashlib.sha256(blob).hexdigest()
        _ = cache.get(k)
        t1 = time.perf_counter()
        hit_times.append((t1 - t0) * 1000)

    avg_cache_hit_ms = float(np.mean(hit_times))

    speedup_percent = ((avg_no_cache_ms - avg_cache_hit_ms) / avg_no_cache_ms) * 100.0
    speedup_factor = avg_no_cache_ms / avg_cache_hit_ms if avg_cache_hit_ms > 0 else float("inf")

    return {
        "benchmark_audio_file": str(audio_path),
        "avg_hash_ms": avg_hash_ms,
        "avg_lookup_ms": avg_lookup_ms,
        "avg_no_cache_model_call_ms": avg_no_cache_ms,
        "avg_cache_hit_request_ms": avg_cache_hit_ms,
        "speedup_percent": float(speedup_percent),
        "speedup_factor": float(speedup_factor),
        "notes": [
            "No-cache timing includes onset detection, spectrogram generation, CNN inference, and MIDI write.",
            "Cache-hit timing includes SHA-256 computation and dictionary cache lookup only.",
            "Benchmark executed on local development machine and should be treated as environment-specific.",
        ],
    }


def main():
    model_path = find_model_path()
    metrics = evaluate_cnn(model_path)
    chart_paths = create_charts(metrics)
    benchmark = benchmark_hashing_vs_no_hash()

    output = {
        "cnn_metrics": metrics,
        "charts": chart_paths,
        "hashing_benchmark": benchmark,
    }

    out_file = ROOT / "cnn_report_data.json"
    out_file.write_text(json.dumps(output, indent=2), encoding="utf-8")

    print("Saved:", out_file)
    print("Charts:")
    for k, v in chart_paths.items():
        print(f"  - {k}: {v}")
    print("\nOverall CNN metrics:")
    for k, v in metrics["overall"].items():
        print(f"  {k}: {v:.4f}")
    print("\nHash benchmark:")
    print(f"  no-cache avg ms: {benchmark['avg_no_cache_model_call_ms']:.2f}")
    print(f"  cache-hit avg ms: {benchmark['avg_cache_hit_request_ms']:.2f}")
    print(f"  speedup percent: {benchmark['speedup_percent']:.2f}%")


if __name__ == "__main__":
    main()
