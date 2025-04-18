# preprocess_data.py

import pandas as pd
import numpy as np

# Set file paths
FOOD_DATA_PATH = "en.openfoodfacts.org.products.tsv"
CHEMICAL_DATA_PATH = "chem_disease_ctd.csv"

# Set output paths
FOOD_OUTPUT_CSV = "cleaned_food_sample.csv"
CHEM_OUTPUT_CSV = "cleaned_ctd_sample.csv"

# ------------------- Step 1: Process Open Food Facts -------------------

def preprocess_food_dataset():
    print("Loading food dataset...")
    df = pd.read_csv(FOOD_DATA_PATH, sep="\t", low_memory=False)

    # Randomize and sample 2000 rows
    df_sampled = df.sample(n=2000, random_state=42)

    # Select required columns (shortened for brevity, add more as needed)
    selected_columns = [
        "code", "product_name", "ingredients_text", "allergens", "nutrition_grade_fr", "nutrition_grade_uk",
        "energy_100g", "fat_100g", "saturated-fat_100g", "monounsaturated-fat_100g", "polyunsaturated-fat_100g",
        "omega-3-fat_100g", "trans-fat_100g", "cholesterol_100g", "carbohydrates_100g", "sugars_100g",
        "fiber_100g", "proteins_100g", "casein_100g", "salt_100g", "sodium_100g", "vitamin-a_100g",
        "vitamin-c_100g", "calcium_100g", "iron_100g", "nutrition-score-fr_100g", "nutrition-score-uk_100g"
    ]

    df_selected = df_sampled[selected_columns].copy()

    # Rename 'code' to 'barcode' for consistency
    df_selected.rename(columns={"code": "barcode"}, inplace=True)

    # Drop rows with missing barcode or product_name
    df_selected.dropna(subset=["barcode", "product_name"], inplace=True)

    print(f"Saving cleaned food dataset with {df_selected.shape[0]} rows...")
    df_selected.to_csv(FOOD_OUTPUT_CSV, index=False)


# ------------------- Step 2: Process Chemical-Disease CTD -------------------

def preprocess_ctd_dataset():
    print("Loading CTD chemical-disease dataset...")
    df = pd.read_csv(CHEMICAL_DATA_PATH)

    selected_columns = [
    "ChemicalName",        # node
    "ChemicalID",          # node ID
    "CasRN",               # node property (optional)
    "DiseaseName",         # node
    "DiseaseID",           # node ID
    "DirectEvidence",      # edge property
    "InferenceGeneSymbol", # optional intermediate node
    "InferenceScore",      # edge property
    "PubMedIDs"            # optional reference
]

    df_selected = df[selected_columns].copy()

    print(f"Saving cleaned CTD dataset with {df_selected.shape[0]} rows...")
    df_selected.to_csv(CHEM_OUTPUT_CSV, index=False)


if __name__ == "__main__":
    preprocess_food_dataset()
    preprocess_ctd_dataset()
