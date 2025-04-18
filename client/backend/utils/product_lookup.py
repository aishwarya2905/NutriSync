import pandas as pd
import math

# Load all columns
product_df = pd.read_csv("data/products.tsv", sep="\t", dtype=str, low_memory=False)

# Clean column names
product_df.columns = product_df.columns.str.strip()

# Fill NAs so json can handle it
product_df = product_df.fillna("")

def clean_record(record: pd.Series) -> dict:
    return {key: value for key, value in record.to_dict().items() if value not in ["", "nan", "NaN", None]}

def find_product_by_barcode(barcode: str):
    match = product_df[product_df["code"] == barcode]
    if match.empty:
        return None

    row = match.iloc[0]
    return clean_record(row)
