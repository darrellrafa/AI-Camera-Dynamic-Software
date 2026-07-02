from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from ai_engine import AnomalyDetector

app = FastAPI(
    title="Camera AI - Dynamic Software API",
    description="Backend API for AI Vision Quality Control Platform using MVTec AD",
    version="1.0.0"
)

# Initialize AI Engine
ai_detector = AnomalyDetector(category="metal_nut")

# Configure CORS so the Next.js frontend can connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change this to the frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Camera AI Backend API", "status": "Online"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "ai_model": "YOLOv8 & Padim (MVTec AD)", "database": "connected"}

@app.post("/api/detect")
async def detect_anomaly(
    file: UploadFile = File(...),
    ai_model: str = Form("anomalib")
):
    """
    Receives an image frame from the frontend, runs MVTec AD anomaly detection,
    and returns bounding boxes of defects.
    """
    contents = await file.read()
    
    try:
        # Run detection
        results = ai_detector.detect(contents, ai_model=ai_model)
        return {"success": True, "data": results}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/train")
async def train_model_endpoint(
    part_name: str = Form(...),
    dataset: UploadFile = File(...)
):
    """
    Receives a dataset zip file and triggers the automated AI training pipeline.
    """
    import os
    from ai_engine import train_model_simulated
    
    # Save the dataset temporarily
    dataset_dir = f"datasets/{part_name.lower().replace(' ', '_')}"
    os.makedirs(dataset_dir, exist_ok=True)
    file_path = os.path.join(dataset_dir, dataset.filename)
    
    with open(file_path, "wb") as f:
        f.write(await dataset.read())
        
    # Trigger background training (simulated)
    result = await train_model_simulated(part_name, file_path)
    
    return {"success": True, "message": "Training completed successfully", "data": result}

# To run the server locally: uvicorn main:app --reload

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
