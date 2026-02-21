from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import PyPDF2
import pickle
import numpy as np
import re
from typing import Optional
import uvicorn

app = FastAPI()

# ================================
# LOAD TRAINED MODEL
# ================================

try:
    model = pickle.load(open("degree_model.pkl", "rb"))
    vectorizer = pickle.load(open("vectorizer.pkl", "rb"))
except Exception as e:
    raise RuntimeError(f"Model loading failed: {e}")

# ================================
# REQUEST / RESPONSE MODELS
# ================================

class AnalysisRequest(BaseModel):
    application_id: int
    cv_file_path: str
    selected_program_id: str  # UUID string


class AnalysisResponse(BaseModel):
    predicted_degree: str
    confidence_score: float
    qualification_status: str
    qualification_match: bool


# ================================
# HELPER FUNCTIONS
# ================================

def extract_text(file_path: str) -> str:
    try:
        with open(file_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted
            return text.lower()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF parsing error: {e}")


def predict_degree(text: str):
    X = vectorizer.transform([text])
    probabilities = model.predict_proba(X)[0]
    classes = model.classes_

    predicted_index = np.argmax(probabilities)
    predicted_degree = classes[predicted_index]
    confidence = float(probabilities[predicted_index])

    return predicted_degree, confidence


def evaluate_qualification(text: str):
    # Extract A/L grades
    grades = re.findall(r'\b[a|b|c|s]\b', text)
    pass_count = len(grades)

    # Detect Mathematics stream
    math_stream = "mathematics" in text or "math stream" in text

    # Detect projects / certifications
    has_projects = "project" in text
    has_certifications = "certification" in text

    # Qualification rules
    if pass_count < 3:
        return "underqualified"

    if has_projects or has_certifications:
        return "overqualified"

    return "qualified"


# ================================
# MAIN ANALYSIS ENDPOINT
# ================================

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalysisRequest):

    # 1️⃣ Extract CV text
    text = extract_text(request.cv_file_path)

    # 2️⃣ Predict degree using ML
    predicted_degree, confidence = predict_degree(text)

    # 3️⃣ Evaluate qualification
    qualification_status = evaluate_qualification(text)

    qualification_match = qualification_status != "underqualified"

    return AnalysisResponse(
        predicted_degree=predicted_degree,
        confidence_score=round(confidence, 2),
        qualification_status=qualification_status,
        qualification_match=qualification_match
    )


# ================================
# HEALTH CHECK
# ================================

@app.get("/health")
async def health():
    return {"status": "AI service running"}


# ================================
# RUN SERVER
# ================================

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
