# vector_index_builder.py

import pandas as pd
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.docstore.document import Document
from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings
import os
import pickle

# Config
VECTOR_INDEX_DIR = "faiss_index_kg"
DATA_FILE = "cleaned_food_sample.csv"

# Use NVIDIA embeddings
embedding_model = NVIDIAEmbeddings(
    model="nvidia/llama-3.2-nv-embedqa-1b-v2",
    api_key="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",
    truncate="NONE"
)

# Load food data
print("🔍 Loading cleaned food dataset...")
df = pd.read_csv(DATA_FILE)
documents = []

for _, row in df.iterrows():
    barcode = row.get("barcode", "")
    name = row.get("product_name", "")
    nutrition_fr = row.get("nutrition_grade_fr", "")
    nutrition_uk = row.get("nutrition_grade_uk", "")
    energy = row.get("energy_100g", "")
    fat = row.get("fat_100g", "")
    saturated_fat = row.get("saturated-fat_100g", "")
    sugar = row.get("sugars_100g", "")
    fiber = row.get("fiber_100g", "")
    protein = row.get("proteins_100g", "")
    salt = row.get("salt_100g", "")
    sodium = row.get("sodium_100g", "")
    vitamin_a = row.get("vitamin-a_100g", "")
    vitamin_c = row.get("vitamin-c_100g", "")
    iron = row.get("iron_100g", "")
    calcium = row.get("calcium_100g", "")
    allergens = row.get("allergens", "")
    additives = row.get("additives", "")
    ingredients = row.get("ingredients_text", "")
    category = row.get("categories", "")

    # Construct document content
    content = f"""
    Barcode: {barcode}
    Product: {name}
    Nutrition Grade (FR): {nutrition_fr}
    Nutrition Grade (UK): {nutrition_uk}
    Energy (100g): {energy}
    Fat (100g): {fat}
    Saturated Fat (100g): {saturated_fat}
    Sugar (100g): {sugar}
    Fiber (100g): {fiber}
    Protein (100g): {protein}
    Salt (100g): {salt}
    Sodium (100g): {sodium}
    Vitamin A (100g): {vitamin_a}
    Vitamin C (100g): {vitamin_c}
    Iron (100g): {iron}
    Calcium (100g): {calcium}
    Allergens: {allergens}
    Additives: {additives}
    Ingredients: {ingredients}
    Category: {category}
    """

    documents.append(Document(page_content=content.strip()))

# Build FAISS vector store
print("📦 Creating FAISS index with NVIDIA embeddings...")
vector_store = FAISS.from_documents(documents, embedding_model)

# Save index locally
if not os.path.exists(VECTOR_INDEX_DIR):
    os.makedirs(VECTOR_INDEX_DIR)

vector_store.save_local(VECTOR_INDEX_DIR)
with open(os.path.join(VECTOR_INDEX_DIR, "index.pkl"), "wb") as f:
    pickle.dump(vector_store, f)

print(f"Saved vector index with {len(documents)} documents to `{VECTOR_INDEX_DIR}`")
