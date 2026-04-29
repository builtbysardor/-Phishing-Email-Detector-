from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import os

app = FastAPI(title="Phishing Email Detector API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to model and vectorizer
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'ml', 'model.joblib')
VECTORIZER_PATH = os.path.join(BASE_DIR, 'ml', 'vectorizer.joblib')

class EmailInput(BaseModel):
    text: str

class PredictionOutput(BaseModel):
    is_phishing: bool
    confidence: float
    type: str

def load_model():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
        return None, None
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    return model, vectorizer

model, vectorizer = load_model()

@app.post("/predict", response_model=PredictionOutput)
async def predict(email: EmailInput):
    global model, vectorizer
    if model is None or vectorizer is None:
        # Try loading again (in case it was just trained)
        model, vectorizer = load_model()
        if model is None:
            raise HTTPException(status_code=503, detail="ML Model not trained yet.")
    
    # Vectorize input
    input_tfidf = vectorizer.transform([email.text])
    
    # Predict
    prediction = model.predict(input_tfidf)[0]
    probabilities = model.predict_proba(input_tfidf)[0]
    
    # Assuming label 1 is phishing, 0 is safe
    is_phishing = bool(prediction == 1)
    confidence = float(probabilities[1] if is_phishing else probabilities[0])
    
    return {
        "is_phishing": is_phishing,
        "confidence": round(confidence, 4),
        "type": "Phishing" if is_phishing else "Safe"
    }

@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": model is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
