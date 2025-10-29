import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import joblib
import os
import warnings
from sklearn.exceptions import UndefinedMetricWarning

# --- Suppress Warnings ---
# We will get warnings about classes not in the test set.
# This is expected, so we suppress them.
warnings.filterwarnings("ignore", category=UndefinedMetricWarning)

# Define file paths
DATA_PATH = "../data/ipc_sections.csv"
MODEL_PATH = "ipc_model_basic.pkl"

# --- 1️⃣ Load dataset ---
print("📂 Loading dataset...")
df = pd.read_csv(DATA_PATH)

# --- 2️⃣ Clean dataset ---
# This correctly handles your NaN values
df = df.dropna(subset=["Description", "Section"])
df["Offense"] = df["Offense"].fillna("")
df["Punishment"] = df["Punishment"].fillna("")
print(f"Total rows after cleaning: {df.shape[0]}")

# --- 3️⃣ Define features and labels ---
df["combined_text"] = (
    df["Description"].astype(str)
    + " | Offense: " + df["Offense"].astype(str)
    + " | Punishment: " + df["Punishment"].astype(str)
)
X = df["combined_text"]
y = df["Section"]

# --- 4️⃣ Analyze Data Limitation ---
print("\n--- ‼️ IMPORTANT ANALYSIS ‼️ ---")
print(f"Total Data Rows: {df.shape[0]}")
print(f"Total Unique Classes (Sections): {y.nunique()}")
print("This means almost every class has only 1 sample.")
print("A model cannot learn from a single example per class.")
print("Accuracy will be near 0. This is a data limitation.")
print("---------------------------------")

# --- 5️⃣ Split data ---
# NOTE: We must remove 'stratify=y' or the code will crash
# because all classes are too rare.
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"Training set size: {len(X_train)}")
print(f"Test set size: {len(X_test)}")

# --- 6️⃣ Build simple model pipeline ---
# We cannot use RandomizedSearchCV or Cross-Validation (cv=5)
# as it's impossible with this data.
model = Pipeline([
    ("tfidf", TfidfVectorizer(stop_words="english")),
    ("clf", LogisticRegression(max_iter=500, random_state=42))
])

# --- 7️⃣ Train model ---
print("🧠 Training a simple model...")
model.fit(X_train, y_train)

# --- 8️⃣ Evaluate model ---
# WARNING: This accuracy score is not meaningful.
score = model.score(X_test, y_test)
print(f"✅ Model trained. Accuracy on test set: {score:.4f}")

# --- 9️⃣ Save model ---
joblib.dump(model, MODEL_PATH)
print(f"💾 Model saved successfully as {MODEL_PATH}")

# --- 1️⃣0️⃣ Verify ---
if not X_test.empty:
    sample_text = X_test.iloc[0]
    predicted = model.predict([sample_text])[0]
    actual = y_test.iloc[0]

    print("\n🔍 Sample prediction check:")
    print("Input:", sample_text[:150] + "...") # Print snippet
    print("Predicted Section:", predicted)
    print("Actual Section:   ", actual)