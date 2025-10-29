from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os
import google.generativeai as genai

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ==== Paths ====
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "..", "model", "ipc_model_basic.pkl")
DATA_PATH = os.path.join(BASE_DIR, "..", "data", "ipc_sections.csv")

# ==== Load Model and Data ====
model = joblib.load(MODEL_PATH)
ipc_data = pd.read_csv(DATA_PATH)

# ==== Gemini Flash API Setup ====
# Replace with your own Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or "AIzaSyCdZFBJb46UKIFR-NR5Osq5GYXCSECAC18"
genai.configure(api_key=GEMINI_API_KEY)

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        text = data.get("incident", "").strip()

        if not text:
            return jsonify({"error": "No input provided"}), 400

        # Predict section
        predicted_section = model.predict([text])[0]

        # Find match in CSV
        match = ipc_data[ipc_data["Section"] == predicted_section]
        if match.empty:
            return jsonify({"error": "Section not found in dataset"}), 404

        section_row = match.iloc[0].fillna("Not available")

        # Build base result
        result = {
            "section": section_row["Section"],
            "offense": section_row.get("Offense", "Not available"),
            "description": section_row.get("Description", "Not available"),
            "punishment": section_row.get("Punishment", "Not available")
        }

        # ==== Use Gemini Flash for More Details ====
        prompt = f"""
        You are a legal AI assistant. Provide a structured summary in points about IPC Section {result['section']}.

        Details:
        - Offense: {result['offense']}
        - Description: {result['description']}
        - Punishment: {result['punishment']}

        Provide:
        1. A short summary
        2. Key legal interpretation
        3. Common examples where this section applies
        4. Important judicial notes (if any)
        Format the response in bullet points.
        """

        model_gemini = genai.GenerativeModel("gemini-2.5-flash")
        ai_response = model_gemini.generate_content(prompt)

        result["moreDetails"] = ai_response.text.strip()

        return jsonify(result)

    except Exception as e:
        print("❌ Error in /predict:", str(e))
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
