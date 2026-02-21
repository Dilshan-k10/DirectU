# AI CV Analysis Service

## Setup

1. Install Python dependencies:
```bash
cd ai-service
pip install -r requirements.txt
```

2. Start the service:
```bash
python main.py
```

Service runs on `http://localhost:8000`

## API Endpoints

### POST /analyze
Analyze CV and extract keywords
```json
{
  "application_id": 1,
  "cv_file_path": "uploads/cvs/cv.pdf",
  "selected_program_id": "uuid"
}
```

Response:
```json
{
  "extracted_keywords": ["python", "java", "bachelor"],
  "qualification_match": true,
  "confidence_score": 0.85,
  "suggested_program_id": null
}
```

### GET /health
Health check endpoint
