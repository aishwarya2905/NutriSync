from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from utils.product_lookup import find_product_by_barcode
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import cv2
import numpy as np

app = FastAPI()

# Enable CORS if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BarcodeRequest(BaseModel):
    barcode: str

@app.post("/analyze")
async def analyze_product(data: BarcodeRequest):
    product = find_product_by_barcode(data.barcode)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/detect-barcode")
async def detect_barcode(image: UploadFile = File(...)):
    try:
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        detector = cv2.barcode_BarcodeDetector()
        results = detector.detectAndDecode(img)

        if len(results) == 3:
            ok, decoded_info, _ = results
        else:
            ok, decoded_info, _, _ = results

        if ok and decoded_info and decoded_info[0]:
            return {"barcode": decoded_info[0]}
        else:
            raise HTTPException(status_code=404, detail="No barcode detected")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting barcode: {str(e)}")


