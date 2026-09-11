from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import subprocess
import sys
import webbrowser
import time

from backend.routes.resume_routes import router as resume_router
from backend.routes.assessment_routes import router as assessment_router
from backend.routes.report_routes import router as report_router

app = FastAPI(
    title="METI Assessment API",
    description="Backend API for METI Management Consulting Assessment Platform",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "METI Assessment API is running",
        "status": "success"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


app.include_router(resume_router)
app.include_router(assessment_router)
app.include_router(report_router)

if __name__ == "__main__":

    # Start frontend server
    frontend_server = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "http.server",
            "5500"
        ]
    )

    # Wait for frontend to start
    time.sleep(2)

    # Open METI frontend in browser
    webbrowser.open("http://localhost:5500/frontend/index.html")

    # Start backend server
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000
    )