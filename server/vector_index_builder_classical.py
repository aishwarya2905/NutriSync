# vector_index_builder_classical.py

import pandas as pd
from langchain_community.vectorstores import FAISS
from langchain.docstore.document import Document
from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings
import os
import pickle
from tqdm import tqdm

# Config
VECTOR_INDEX_DIR = "faiss_index_classical"
FOOD_FILE = "cleaned_food_sample.csv"
CTD_FILE = "cleaned_ctd_sample.csv"
BATCH_SIZE = 1000

# Initialize embedding model
embedding_model = NVIDIAEmbeddings(
    model="nvidia/llama-3.2-nv-embedqa-1b-v2",
    api_key="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",
    truncate="NONE"
)

# Load data
print("🔍 Loading cleaned food and CTD datasets...")
food_df = pd.read_csv(FOOD_FILE)
ctd_df = pd.read_csv(CTD_FILE)

# Generate text chunks from food data
food_docs = []
for _, row in food_df.iterrows():
    content = f"""
    [FOOD]
    Barcode: {row.get('barcode', '')}
    Product: {row.get('product_name', '')}
    Nutrition Grade (FR): {row.get('nutrition_grade_fr', '')}
    Nutrition Score: {row.get('nutrition-score-fr_100g', '')}
    Energy (100g): {row.get('energy_100g', '')}
    Fat (100g): {row.get('fat_100g', '')}, Saturated: {row.get('saturated-fat_100g', '')}, Sugar: {row.get('sugars_100g', '')}, Fiber: {row.get('fiber_100g', '')}, Protein: {row.get('proteins_100g', '')}
    Sodium: {row.get('sodium_100g', '')}, Salt: {row.get('salt_100g', '')}
    Vitamins: A={row.get('vitamin-a_100g', '')}, C={row.get('vitamin-c_100g', '')}, Calcium={row.get('calcium_100g', '')}, Iron={row.get('iron_100g', '')}
    Additives: {row.get('additives', '')}
    Allergens: {row.get('allergens', '')}
    Ingredients: {row.get('ingredients_text', '')}
    Category: {row.get('categories', '')}
    """
    food_docs.append(Document(page_content=content.strip()))

# Generate text chunks from CTD data
ctd_docs = []
for _, row in ctd_df.iterrows():
    content = f"""
    [CTD]
    Chemical: {row.get('ChemicalName', '')} (ID: {row.get('ChemicalID', '')}, CAS: {row.get('CasRN', '')})
    Disease: {row.get('DiseaseName', '')} (ID: {row.get('DiseaseID', '')})
    Evidence: {row.get('DirectEvidence', '')}
    Gene Inference: {row.get('InferenceGeneSymbol', '')}, Score: {row.get('InferenceScore', '')}
    OMIM IDs: {row.get('OmimIDs', '')}
    PubMed IDs: {row.get('PubMedIDs', '')}
    """
    ctd_docs.append(Document(page_content=content.strip()))

# Merge all docs
all_docs = food_docs + ctd_docs
print(f"📄 Total documents to embed: {len(all_docs)}")

# Batched embedding
print("📦 Creating FAISS index for classical RAG (batched)...")
index = None
for i in tqdm(range(0, len(all_docs), BATCH_SIZE)):
    batch = all_docs[i:i+BATCH_SIZE]
    if not batch:
        continue
    if index is None:
        index = FAISS.from_documents(batch, embedding_model)
    else:
        index.add_documents(batch)

# Save index
if not os.path.exists(VECTOR_INDEX_DIR):
    os.makedirs(VECTOR_INDEX_DIR)

index.save_local(VECTOR_INDEX_DIR)
with open(os.path.join(VECTOR_INDEX_DIR, "index.pkl"), "wb") as f:
    pickle.dump(index, f)

print(f"✅ Classical vector index saved with {len(all_docs)} documents at `{VECTOR_INDEX_DIR}`")
