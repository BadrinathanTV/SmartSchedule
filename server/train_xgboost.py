"""
Train an XGBoost model for predicting transition drop-off probability.

Usage:
  - Train from a labeled CSV:
      python3 server/train_xgboost.py --csv data/transition_training.csv --output server/xgboost_model.bst

CSV must contain the following columns (features expected by `server/predictor.py`):
  embedding_similarity, genre_similarity, demographic_alignment, time_slot_fit,
  genre_fatigue, seasonality_fit, day_of_week_fit, festival_boost, label_dropoff

Alternatively, the script can attempt to build training samples from stored schedules if you implement
an export that produces the required labeled examples. For production you should curate labeled
examples from historical schedules and analytics.
"""
import argparse
import os
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error


FEATURE_COLS = [
    'embedding_similarity', 'genre_similarity', 'demographic_alignment',
    'time_slot_fit', 'genre_fatigue', 'seasonality_fit', 'day_of_week_fit', 'festival_boost'
]


def train_from_csv(csv_path: str, output_path: str, test_size: float = 0.2, random_state: int = 42):
    df = pd.read_csv(csv_path)
    missing = [c for c in FEATURE_COLS + ['label_dropoff'] if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns in CSV: {missing}")

    X = df[FEATURE_COLS].astype(float)
    y = df['label_dropoff'].astype(float)

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=test_size, random_state=random_state)

    model = xgb.XGBRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.05,
        objective='reg:squarederror',
        verbosity=1,
        n_jobs=4,
    )

    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], early_stopping_rounds=20, verbose=True)

    preds = model.predict(X_val)
    mse = mean_squared_error(y_val, preds)
    print(f"Validation MSE: {mse:.6f}")

    # Save model
    booster = model.get_booster()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    booster.save_model(output_path)
    print(f"Model saved to {output_path}")


def main():
    parser = argparse.ArgumentParser(description='Train XGBoost transition drop-off model')
    parser.add_argument('--csv', help='Path to labeled CSV file', required=True)
    parser.add_argument('--output', help='Output model path (bst)', required=True)
    args = parser.parse_args()

    train_from_csv(args.csv, args.output)


if __name__ == '__main__':
    main()
