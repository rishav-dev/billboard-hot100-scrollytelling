# prepare_data.py

import json
import math
from pathlib import Path

import pandas as pd


# ---------- CONFIG ----------
# Try data/ first, then root as fallback
BASE_DIR = Path(__file__).resolve().parent
CSV_PATHS = [
    BASE_DIR / "data" / "billboard_24years_lyrics_spotify.csv",
    BASE_DIR / "billboard_24years_lyrics_spotify.csv",
]

csv_path = None
for p in CSV_PATHS:
    if p.exists():
        csv_path = p
        break

if csv_path is None:
    raise FileNotFoundError(
        "Could not find billboard_24years_lyrics_spotify.csv in ./data or ./"
    )

DATA_DIR = csv_path.parent  # where we'll also drop the JSONs

NUMERIC_COLS = [
    "danceability",
    "energy",
    "valence",
    "acousticness",
    "tempo",
    "loudness",
    "speechiness",
    "instrumentalness",
    "liveness",
]


def clean_for_json(records):
    """Replace NaN/inf with None so JSON is valid."""
    for rec in records:
        for k, v in rec.items():
            if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                rec[k] = None
    return records


def main():
    print(f"Loading CSV from: {csv_path}")
    df = pd.read_csv(csv_path)

    # ---- Basic type cleaning ----
    df["year"] = pd.to_numeric(df["year"], errors="coerce").astype("Int64")
    for col in NUMERIC_COLS:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Mark rows that have at least one audio feature
    df["has_audio"] = df[NUMERIC_COLS].notna().any(axis=1)

    # ---- Deduplicate: keep one row per (year, ranking, song) ----
    # Prefer rows that actually have audio features
    df_sorted = df.sort_values(
        ["year", "ranking", "song", "has_audio"],
        ascending=[True, True, True, False],
    )

    songs_all = df_sorted.drop_duplicates(
        subset=["year", "ranking", "song"], keep="first"
    ).copy()

    # ---- SONGS JSON (base dataset) ----
    # Keep all songs, even if they don't have audio features, so counts per year work.
    songs_out = songs_all[
        ["year", "ranking", "song", "band_singer", *NUMERIC_COLS]
    ].rename(
        columns={
            "ranking": "rank",
            "song": "title",
            "band_singer": "artist",
        }
    )

    # Synthetic popularity (rough proxy): 1 = worst, 100 = best
    songs_out["popularity"] = (101 - songs_out["rank"]).astype(int)

    songs_records = clean_for_json(songs_out.to_dict(orient="records"))
    songs_path = DATA_DIR / "songs_clean.json"
    with songs_path.open("w", encoding="utf-8") as f:
        json.dump(songs_records, f, indent=2, allow_nan=False)

    print(f"Wrote {len(songs_records)} songs to {songs_path.relative_to(BASE_DIR)}")

    # ---- Filter to rows that actually have audio features ----
    songs_with_audio = songs_all[songs_all["has_audio"]].copy()

    # ---- YEARLY FEATURES JSON (for trends & conclusion chart) ----
    yearly = (
        songs_with_audio.groupby("year")[NUMERIC_COLS].mean().reset_index()
    )

    yearly_records = clean_for_json(yearly.to_dict(orient="records"))
    yearly_path = DATA_DIR / "yearly_features.json"
    with yearly_path.open("w", encoding="utf-8") as f:
        json.dump(yearly_records, f, indent=2, allow_nan=False)

    print(
        f"Wrote {len(yearly_records)} yearly feature rows to "
        f"{yearly_path.relative_to(BASE_DIR)}"
    )

    # ---- ARTIST SUMMARY JSON (for bubbles & radar charts) ----
    artist_group = (
        songs_with_audio.groupby("band_singer")
        .agg(
            count=("song", "count"),
            avgDanceability=("danceability", "mean"),
            avgEnergy=("energy", "mean"),
            avgValence=("valence", "mean"),
            avgAcousticness=("acousticness", "mean"),
        )
        .reset_index()
        .rename(columns={"band_singer": "artist"})
    )

    # Only keep artists with enough data (tweak threshold if you like)
    artist_summary = artist_group[artist_group["count"] >= 5].reset_index(drop=True)

    artist_records = clean_for_json(artist_summary.to_dict(orient="records"))
    artist_path = DATA_DIR / "artist_summary.json"
    with artist_path.open("w", encoding="utf-8") as f:
        json.dump(artist_records, f, indent=2, allow_nan=False)

    print(
        f"Wrote {len(artist_records)} artists to {artist_path.relative_to(BASE_DIR)}"
    )

    print("✅ Done. JSON files are ready for your website & analysis.")


if __name__ == "__main__":
    main()
