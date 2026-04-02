#!/usr/bin/env python3
"""
Extract real model metrics from the training data using train-test split.
This uses the actual drum features and generates precision, recall, F1, and confusion matrix.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import json

# Load features from CSV
print("Loading features...")
features_df = pd.read_csv('csv/features.csv')
print(f"Loaded {len(features_df)} samples")
print(f"Columns: {features_df.columns.tolist()}")
print(features_df.head())

# Parse feature strings
def parse_feature_string(feature_str):
    newstr = feature_str.strip('[]')
    return np.fromstring(newstr, sep=' ')

features_df['feature'] = features_df['feature'].apply(parse_feature_string)
print("\nSuccessfully converted feature strings to NumPy arrays.")

# Prepare data
X = np.array(features_df['feature'].tolist())
y = np.array(features_df['class'].tolist())

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print("\n--- Data Split Complete ---")
print(f"Total samples:     {len(X)}")
print(f"Training samples:  {len(X_train)} (80%)")
print(f"Testing samples:   {len(X_test)} (20%)")
print(f"Shape of X_train:  {X_train.shape}")

# Feature scaling
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
print("\n--- Feature Scaling Complete ---")
print(f"Mean of scaled X_train (should be ~0): {X_train_scaled.mean():.2f}")
print(f"Std Dev of scaled X_train (should be ~1): {X_train_scaled.std():.2f}")

# Train model
print("\n--- Training the Model ---")
model = LogisticRegression(random_state=42, max_iter=1000)
model.fit(X_train_scaled, y_train)
print("Model training complete.")

# Evaluate model
print("\n--- Model Evaluation ---")
y_pred = model.predict(X_test_scaled)

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average='weighted')
recall = recall_score(y_test, y_pred, average='weighted')
f1 = f1_score(y_test, y_pred, average='weighted')
conf_matrix = confusion_matrix(y_test, y_pred)

print(f"\nAccuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
print(f"Precision: {precision:.4f} ({precision*100:.2f}%)")
print(f"Recall:    {recall:.4f} ({recall*100:.2f}%)")
print(f"F1 Score:  {f1:.4f} ({f1*100:.2f}%)")

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

print("\nConfusion Matrix:")
print(conf_matrix)
print(f"Shape: {conf_matrix.shape}")

# Generate per-class metrics
print("\n--- Per-Class Metrics ---")
classes = sorted(np.unique(y_test))
for cls in classes:
    class_mask = y_test == cls
    class_acc = np.mean(y_pred[class_mask] == y_test[class_mask])
    print(f"Class {cls}: Accuracy = {class_acc:.4f} ({class_acc*100:.2f}%)")

# Save to JSON
metrics_data = {
    "model_info": {
        "type": "LogisticRegression",
        "training_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "total_samples": int(len(X)),
        "features_per_sample": int(X.shape[1]),
        "feature_source": "csv/features.csv"
    },
    "overall_metrics": {
        "accuracy": float(accuracy),
        "accuracy_percentage": float(accuracy * 100),
        "precision": float(precision),
        "precision_percentage": float(precision * 100),
        "recall": float(recall),
        "recall_percentage": float(recall * 100),
        "f1_score": float(f1),
        "f1_score_percentage": float(f1 * 100)
    },
    "confusion_matrix": conf_matrix.tolist(),
    "confusion_matrix_shape": list(conf_matrix.shape)
}

with open('model_metrics.json', 'w') as f:
    json.dump(metrics_data, f, indent=2)

print("\n✓ Metrics saved to model_metrics.json")
