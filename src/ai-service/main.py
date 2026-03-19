from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import PyPDF2
import pickle
import numpy as np
import re
from typing import Optional, List, Dict, Any
import uvicorn
import asyncpg
import os
import io
import uuid
from datetime import datetime
from dotenv import load_dotenv, find_dotenv

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
# DATABASE CONNECTION
# ================================

# Load environment variables from the nearest .env file so that
# DATABASE_URL defined in the project root is automatically picked up.
load_dotenv(find_dotenv())

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")


@app.on_event("startup")
async def startup() -> None:
    app.state.db_pool = await asyncpg.create_pool(DATABASE_URL)


@app.on_event("shutdown")
async def shutdown() -> None:
    pool = app.state.db_pool
    await pool.close()

# ================================
# REQUEST / RESPONSE MODELS
# ================================

class AnalysisRequest(BaseModel):
    # We now only need the Application ID; the service
    # will load the CV and selected program from the DB.
    application_id: str  # UUID string from applications.id


class AnalysisResponse(BaseModel):
    predicted_degree: str
    confidence_score: float
    qualification_status: str
    qualification_match: bool
    similarity_scores: Dict[str, float]
    application_status: str


# ================================
# HELPER FUNCTIONS
# ================================


def extract_text(file_path: str) -> str:
    """
    Legacy helper kept for compatibility when reading from a file path.
    The core PDF extraction logic is shared with the bytes-based helper.
    """
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


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """
    Extract text from a PDF stored as bytes in the database.
    """
    try:
        with io.BytesIO(pdf_bytes) as file_obj:
            reader = PyPDF2.PdfReader(file_obj)
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
GRADE_PATTERN = re.compile(r"\b([ABCS])\b", re.IGNORECASE)
GRADE_ORDER = ["S", "C", "B", "A"]


def extract_features(text: str) -> Dict[str, Any]:
    """
    Extract structured features from the CV text that can be used
    against QualificationCriteria.conditions rules.
    """
    lower = text.lower()

    grades = [g.upper() for g in GRADE_PATTERN.findall(text)]

    stream: Optional[str] = None
    if "mathematics stream" in lower or "maths stream" in lower or "math stream" in lower:
        stream = "Mathematics"
    elif "commerce stream" in lower or "commerce" in lower:
        stream = "Commerce"
    elif "science stream" in lower:
        stream = "Science"
    elif "arts stream" in lower:
        stream = "Arts"

    projects = any(keyword in lower for keyword in ["project", "github", "portfolio"])

    certifications: List[str] = []
    if "coursera" in lower:
        certifications.append("Coursera")
    if "linkedin learning" in lower or "linkedin-learning" in lower:
        certifications.append("LinkedIn Learning")

    competitions_found: List[str] = []
    known_competitions = [
        "ieee",
        "codesprint",
        "hult prize",
        "codefest",
        "hackathon",
        "codejam",
        "cypher 3.0",
    ]
    for comp in known_competitions:
        if comp in lower:
            competitions_found.append(comp)

    return {
        "stream": stream,
        "grades": grades,
        "projects": projects,
        "certifications": certifications,
        "competitions": competitions_found,
    }


def _count_grades_at_least(grades: List[str], min_grade: str) -> int:
    try:
        idx = GRADE_ORDER.index(min_grade)
    except ValueError:
        return 0
    allowed = set(GRADE_ORDER[idx:])
    return sum(1 for g in grades if g in allowed)


def _evaluate_single_rule(rule_type: str, conditions: Dict[str, Any], features: Dict[str, Any]) -> bool:
    """
    Evaluate a single QualificationCriteria rule against extracted features.
    """
    if rule_type == "required_subject":
        # Stream matching if specified and not "Any"
        required_stream = conditions.get("stream")
        if required_stream and required_stream.lower() != "any":
            if not features.get("stream") or features["stream"] != required_stream:
                return False

        minimum_results = conditions.get("minimumResults") or {}
        grades: List[str] = features.get("grades") or []
        for grade_key, min_count in minimum_results.items():
            count = _count_grades_at_least(grades, grade_key)
            if count < int(min_count):
                return False

        return True

    if rule_type == "required_certification":
        required_platforms = [p.lower() for p in conditions.get("platforms", [])]
        user_certs = [c.lower() for c in features.get("certifications", [])]
        return any(p in user_certs for p in required_platforms)

    if rule_type == "custom":
        # Custom rules in this system are currently used for projects / competitions.
        if "competitions" in conditions:
            return bool(features.get("competitions"))
        if "keywords" in conditions:
            return bool(features.get("projects"))
        return False

    # Unknown rule types default to non-blocking
    return True


def evaluate_qualification_from_criteria(
    criteria_rows: List[asyncpg.Record], features: Dict[str, Any]
) -> str:
    """
    Evaluate qualification status using rules stored in qualification_criteria.
    """
    mandatory_failed = False
    extra_achievements = False

    for row in criteria_rows:
        import json

        rule_type: str = row["rule_type"]
        conditions = row["conditions"]
        is_mandatory: bool = row["is_mandatory"]

        # Ensure JSON is a dictionary
        if isinstance(conditions, str):
            conditions = json.loads(conditions)

        passed = _evaluate_single_rule(rule_type, conditions, features)

        if is_mandatory and not passed:
            mandatory_failed = True
        if (not is_mandatory) and passed:
            extra_achievements = True

    if mandatory_failed:
        return "underqualified"
    if extra_achievements:
        return "overqualified"
    return "qualified"


def map_predicted_degree_to_program_id(predicted_degree, degree_rows):

    if not predicted_degree:
        return None

    # normalize model output
    target = predicted_degree.lower().replace("_", " ").strip()

    for row in degree_rows:
        db_name = row["name"].lower().strip()

        if target == db_name:
            return row["id"]

        if target in db_name or db_name in target:
            return row["id"]

    return None


def map_qualification_to_feedback_type(status: str) -> str:
    if status == "qualified":
        return "qualified"
    if status == "overqualified":
        return "over_qualified"
    if status == "underqualified":
        return "not_qualified"
    return "needs_improvement"


# ================================
# MAIN ANALYSIS ENDPOINT
# ================================

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(payload: AnalysisRequest, request: Request):

    pool = request.app.state.db_pool

    async with pool.acquire() as conn:
        async with conn.transaction():
            # 1️⃣ Load application data, including selected degree and CV PDF
            application_row = await conn.fetchrow(
                """
                SELECT id, program_id, document_data, document_name, document_type, status
                FROM applications
                WHERE id = $1
                """,
                payload.application_id,
            )

            if not application_row:
                raise HTTPException(status_code=404, detail="Application not found")

            selected_program_id: str = application_row["program_id"]
            document_data = application_row["document_data"]
            current_application_status: str = application_row["status"]

            if not document_data:
                raise HTTPException(
                    status_code=400,
                    detail="No CV PDF stored for this application",
                )

            # 2️⃣ Extract CV text from PDF bytes
            text = extract_text_from_pdf_bytes(document_data)

            # 3️⃣ Predict degree using the existing ML model
            ml_label, ml_confidence = predict_degree(text)

            # Map model label to a program_id from the database
            degree_rows = await conn.fetch(
                """
                SELECT id, name
                FROM "Degree"
                """
            )
            predicted_program_id = map_predicted_degree_to_program_id(
                ml_label.replace("_", " "), degree_rows
            )

            confidence = ml_confidence
            similarity_scores: Dict[str, float] = {}

            # 4️⃣ Extract structured features from CV
            features = extract_features(text)

            # 5️⃣ Load and evaluate qualification criteria from DB
            criteria_rows = await conn.fetch(
                """
                SELECT id, criteria_name, rule_type, conditions, weight, is_mandatory
                FROM qualification_criteria
                WHERE program_id = $1
                """,
                selected_program_id,
            )

            qualification_status = evaluate_qualification_from_criteria(
                criteria_rows, features
            )

            # Underqualified => mismatch with selected program
            qualification_match = qualification_status != "underqualified"

            # 6️⃣ Store CVAnalysisResult (upsert by application_id)
            analysis_id = str(uuid.uuid4())
            analyzed_at = datetime.utcnow()

            import json
            await conn.execute(
                """
                INSERT INTO cv_analysis_results (
                    id,
                    application_id,
                    extracted_data,
                    qualification_match,
                    confidence_score,
                    analysis_status,
                    analyzed_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (application_id) DO UPDATE SET
                    extracted_data = EXCLUDED.extracted_data,
                    qualification_match = EXCLUDED.qualification_match,
                    confidence_score = EXCLUDED.confidence_score,
                    analysis_status = EXCLUDED.analysis_status,
                    analyzed_at = EXCLUDED.analyzed_at
                """,
                analysis_id,
                payload.application_id,
                json.dumps(features),
                qualification_match,
                float(round(confidence, 2)),
                "completed",
                analyzed_at,
            )

            # 7️⃣ Candidate feedback
            feedback_type = map_qualification_to_feedback_type(qualification_status)

            if qualification_status == "qualified":
                feedback_message = (
                    "You meet the minimum requirements for the selected degree program."
                )
            elif qualification_status == "overqualified":
                feedback_message = (
                    "You exceed the minimum requirements for the selected degree program."
                )
            else:
                feedback_message = (
                    "Based on your current qualifications, you do not meet all "
                    "mandatory requirements for the selected degree program."
                )

            feedback_id = str(uuid.uuid4())

            await conn.execute(
                """
                INSERT INTO candidate_feedback (
                    id,
                    application_id,
                    feedback_type,
                    message,
                    suggestions
                )
                VALUES ($1, $2, $3, $4, $5)
                """,
                feedback_id,
                payload.application_id,
                feedback_type,
                feedback_message,
                None,
            )

            # 8️⃣ Update application status based on qualification result
            # See prisma/migrations/... for allowed values in ApplicationStatus enum.
            status_map = {
                "qualified": "qualified",
                "overqualified": "qualified",
                "underqualified": "not_qualified",
            }
            application_status = status_map.get(qualification_status, current_application_status)
            # Always attempt to persist a status, even if it doesn't change.
            update_result = await conn.execute(
                """
                UPDATE applications
                SET status = $1,
                    updated_at = NOW()
                WHERE id = $2
                """,
                application_status,
                payload.application_id,
            )

            if not update_result.startswith("UPDATE 1"):
                # Fail fast in case the record was not updated (e.g. id mismatch).
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to update application status (db response: {update_result})",
                )
            
            

            # 9️⃣ Save predicted program in alternative_programs when it differs from selected
            if predicted_program_id and predicted_program_id != selected_program_id:
                alt_id = str(uuid.uuid4())
                predicted_degree = ml_label
                reason_parts = [
                    f"Predicted best-fit degree: {predicted_degree}.",
                    "Selected program differs from predicted program.",
                ]
                if qualification_status == "underqualified":
                    reason_parts.append(
                        "You may be better suited for this alternative program "
                        "based on your current qualifications."
                    )
                elif qualification_status == "overqualified":
                    reason_parts.append(
                        "You may be overqualified for the selected program; this "
                        "alternative may be a stronger match."
                    )
                else:
                    reason_parts.append(
                        "You may also consider this program based on your profile."
                    )

                reason = " ".join(reason_parts)

                await conn.execute(
                    """
                    INSERT INTO alternative_programs (
                        id,
                        feedback_id,
                        program_id,
                        reason,
                        match_score
                    )
                    VALUES ($1, $2, $3, $4, $5)
                    """,
                    alt_id,
                    feedback_id,
                    predicted_program_id,
                    reason,
                    float(round(confidence, 2)),
                )

    # Response payload (semantic prediction + qualification status + similarity scores)
    return AnalysisResponse(
        predicted_degree=ml_label,
        confidence_score=round(confidence, 2),
        qualification_status=qualification_status,
        qualification_match=qualification_match,
        similarity_scores=similarity_scores,
        application_status=application_status,
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
