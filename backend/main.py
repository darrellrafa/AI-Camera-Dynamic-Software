from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Camera AI - Dynamic Software API",
    description="Backend API for AI Vision Quality Control Platform",
    version="1.0.0"
)

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
    return {"status": "healthy", "ai_model": "YOLOv8", "database": "connected"}

# To run the server locally: uvicorn main:app --reload
