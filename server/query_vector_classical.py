# query_vector_classical.py

import os
import pickle
from langchain_community.vectorstores import FAISS
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.messages import HumanMessage
from langchain.prompts import PromptTemplate

# Config
VECTOR_INDEX_DIR = "faiss_index_classical"

# Load FAISS index
print("📥 Loading classical FAISS index...")
with open(os.path.join(VECTOR_INDEX_DIR, "index.pkl"), "rb") as f:
    vector_store = pickle.load(f)

# NVIDIA LLaMA 3.3 Nemotron model for generation
llm = ChatNVIDIA(
    model="meta/llama-3-3b-instruct",
    api_key="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",
)

# Prompt Template
prompt_template = PromptTemplate.from_template("""
You are a health and food safety AI. Based on the information retrieved below, please:
1. Analyze the nutritional quality and health safety of the scanned product.
2. Assess the user's disease risk: {disease}
3. Consider today's health condition: {feeling}
4. Recommend safer alternatives if this product is unsafe

Query: "{query}"

Context:
{context}

Format your response in JSON with: "ratings", "disease_risk", "condition_warnings", "alternatives".
""")

def query_classical_rag(barcode: str, disease: str, feeling: str, k: int = 5):
    user_query = f"Barcode: {barcode}, Disease: {disease}, Feeling: {feeling}"

    # Vector search
    print("🔎 Performing classical RAG search...")
    results = vector_store.similarity_search(user_query, k=k)
    context = "\n\n".join([doc.page_content for doc in results])

    # LLM response
    print("🧠 Generating LLM answer...")
    prompt = prompt_template.format(query=user_query, context=context, disease=disease, feeling=feeling)
    response = llm.invoke([HumanMessage(content=prompt)])
    print("✅ Generation complete.\n")

    return response.content.strip()

# Example usage
if __name__ == "__main__":
    barcode = input("Enter barcode: ")
    disease = input("Enter disease name: ")
    feeling = input("Enter how user feels today (e.g., cold, weak): ")

    output = query_classical_rag(barcode, disease, feeling)
    print("\n📦 Final JSON Output:\n")
    print(output)
