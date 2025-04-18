from langchain_community.vectorstores import FAISS
from langchain_nvidia_ai_endpoints import ChatNVIDIA, NVIDIAEmbeddings
from ragas.testset import TestsetGenerator
from ragas.testset.synthesizers import SpecificQuerySynthesizer

from ragas.wrappers.langchain import LangchainLLMWrapper, LangchainEmbeddingsWrapper
import pickle
import os

# Load documents from KG-based FAISS index
INDEX_PATH = "faiss_index_kg"
with open(os.path.join(INDEX_PATH, "index.pkl"), "rb") as f:
    vector_store = pickle.load(f)

# Extract documents
docs = list(vector_store.docstore._dict.values())
print(f"Loaded {len(docs)} documents from FAISS index.")

# Wrap NVIDIA LLM + Embeddings for RAGAS
llm = LangchainLLMWrapper(
    ChatNVIDIA(model="meta/llama-3.3-nemotron-super-49b-v1", api_key="nvapi-...")
)
embedding = LangchainEmbeddingsWrapper(
    NVIDIAEmbeddings(model="nvidia/llama-3.2-nv-embedqa-1b-v2", api_key="nvapi-...")
)

# Initialize test generator
generator = TestsetGenerator(llm=llm, embedding_model=embedding)
synthesizer = SpecificQuerySynthesizer(llm=llm)

# Generate test set
print("🔄 Generating synthetic test set for KG-RAG...")
testset = generator.generate_with_langchain_docs(
    documents=docs[:50],
    testset_size=20,
    query_distribution=[(synthesizer, 1.0)]
)

testset.save_to_json("testset_kg.json")
print(" Saved testset to testset_kg.json")
