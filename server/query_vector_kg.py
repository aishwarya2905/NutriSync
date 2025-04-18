# query_vector_kg.py

import os
import pickle
from langchain_community.vectorstores import FAISS
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.messages import HumanMessage
from langchain.prompts import PromptTemplate

# Paths
VECTOR_INDEX_DIR = "faiss_index_kg"

# Load FAISS KG index
print("📥 Loading KG-based FAISS index...")
with open(os.path.join(VECTOR_INDEX_DIR, "index.pkl"), "rb") as f:
    vector_store = pickle.load(f)

# NVIDIA LLaMA 3.3 Nemotron Super 49B (for generation)
llm = ChatNVIDIA(
    model="nvidia/llama-3.3-nemotron-super-49b-v1",
    api_key="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"
)

# Prompt Template
prompt_template = PromptTemplate.from_template("""
You are an expert nutrition assistant. A user has scanned a food item and provided a medical condition.

Query: "{query}"

Context:
{context}

Please analyze the ingredients, nutrition, and allergens. Provide:
1. Food safety rating
2. Warnings for health conditions (esp. "{disease}")
3. What to avoid today if the user is feeling: {feeling}
4. Alternative food suggestions if the scanned product is unsafe

Respond in JSON format.
""")

def query_kg_rag(barcode: str, disease: str, feeling: str, k: int = 5):
    user_query = f"Barcode: {barcode}, Disease: {disease}, Feeling: {feeling}"

    # Vector search
    print("🔎 Performing vector search...")
    results = vector_store.similarity_search(user_query, k=k)
    context = "\n\n".join([doc.page_content for doc in results])

    # LLM generation
    print("🧠 Generating answer with LLaMA 3.3 Nemotron...")
    prompt = prompt_template.format(query=user_query, context=context, disease=disease, feeling=feeling)
    response = llm.invoke([HumanMessage(content=prompt)])
    print("✅ Answer generated.\n")

    return response.content.strip()

# Example usage
if __name__ == "__main__":
    barcode = input("📦 Enter barcode: ")
    disease = input("💊 Enter user disease: ")
    feeling = input("🧠 Enter how the user is feeling today (e.g., headache, cold, weak): ")

    output = query_kg_rag(barcode, disease, feeling)
    print("\n📤 Final JSON Output:\n")
    print(output)
