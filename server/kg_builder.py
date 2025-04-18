# kg_builder.py

import pandas as pd
from neo4j import GraphDatabase

# Neo4j config
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "Nutrisync@2"

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

# -- Create chemical-disease KG --
def create_chemical_disease_kg(tx, row):
    tx.run("""
        MERGE (c:Chemical {id: $chemical_id, name: $chemical_name})
        MERGE (d:Disease {id: $disease_id, name: $disease_name})
        MERGE (c)-[r:CAUSES]->(d)
        SET r.evidence = $evidence,
            r.score = $score
    """, {
        "chemical_id": row['ChemicalID'],
        "chemical_name": row['ChemicalName'],
        "disease_id": row['DiseaseID'],
        "disease_name": row['DiseaseName'],
        "evidence": row.get("DirectEvidence", None),
        "score": float(row.get("InferenceScore", 0.0))
    })

def load_ctd_kg():
    print("Loading CTD data...")
    df = pd.read_csv("cleaned_ctd_sample.csv")
    df = df.sample(n=500, random_state=42)  # Add this line to limit rows
    with driver.session() as session:
        for _, row in df.iterrows():
            session.write_transaction(create_chemical_disease_kg, row)
    print(" CTD KG loaded into Neo4j.")


# -- You can also add food-product KG function here next --
def create_food_product_kg(tx, row):
    tx.run("""
        MERGE (p:Product {barcode: $barcode})
        SET p.name = $product_name,
            p.nutrition_grade_fr = $nutrition_grade_fr,
            p.ingredients_text = $ingredients_text,
            p.additives = $additives,
            p.allergens = $allergens,
            p.nutrition_score_fr = $nutrition_score_fr,
            p.image_url = $image_url,
            p.product_url = $product_url,
            p.categories = $categories
    """, {
        "barcode": str(row["barcode"]),
        "product_name": row.get("product_name", ""),
        "nutrition_grade_fr": row.get("nutrition_grade_fr", ""),
        "ingredients_text": row.get("ingredients_text", ""),
        "additives": row.get("additives", ""),
        "allergens": row.get("allergens", ""),
        "nutrition_score_fr": row.get("nutrition-score-fr_100g", 0),
        "image_url": row.get("image_url", ""),
        "product_url": row.get("product_url", ""),
        "categories": row.get("categories", "")
    })

def load_food_kg():
    print("Loading food product data...")
    df = pd.read_csv("cleaned_food_sample.csv")
    with driver.session() as session:
        for _, row in df.iterrows():
            session.write_transaction(create_food_product_kg, row)
    print(" Food Product KG loaded into Neo4j.")

if __name__ == "__main__":
    load_ctd_kg()
    load_food_kg()
