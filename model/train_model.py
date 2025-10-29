import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import joblib
import os

# Define file paths
DATA_PATH = os.path.join("..", "data", "ipc_sections.csv")
MODEL_PATH = "ipc_model.pkl"

# 1️⃣ Load dataset
print("📂 Loading dataset...")
df = pd.read_csv(DATA_PATH)

# 2️⃣ Clean dataset
# Drop rows missing key columns
df = df.dropna(subset=["Description", "Section"])

# Replace any NaN values in other columns (like Offense/Punishment)
df = df.fillna("Not available")

# 3️⃣ Define features and labels
# Combine all useful text (Description + Offense + Punishment) for training
df["combined_text"] = (
    df["Description"].astype(str)
    + " | Offense: " + df["Offense"].astype(str)
    + " | Punishment: " + df["Punishment"].astype(str)
)

X = df["combined_text"]
y = df["Section"]

# 4️⃣ Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 5️⃣ Build model pipeline
model = Pipeline([
    ("tfidf", TfidfVectorizer(stop_words="english")),
    ("clf", LogisticRegression(max_iter=500))
])

# 6️⃣ Train model
print("🧠 Training model...")
model.fit(X_train, y_train)

# 7️⃣ Evaluate model
score = model.score(X_test, y_test)
print(f"✅ Model trained successfully! Accuracy: {score:.2f}")

# 8️⃣ Save model
joblib.dump(model, MODEL_PATH)
print(f"💾 Model saved successfully as {MODEL_PATH}")

# 9️⃣ Verify
sample_text = X_test.iloc[0]
predicted = model.predict([sample_text])[0]
print("\n🔍 Sample prediction check:")
print("Input:", sample_text)
print("Predicted Section:", predicted)
