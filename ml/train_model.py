import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

# Create data directory if it doesn't exist
if not os.path.exists('data'):
    os.makedirs('data')

# Dataset URL (Common phishing dataset)
DATA_URL = 'https://raw.githubusercontent.com/Shubham-71/Email-Phishing-Detection/master/dataset.csv'

def download_data():
    if not os.path.exists('data/phishing_dataset.csv'):
        print("Downloading dataset...")
        df = pd.read_csv(DATA_URL)
        df.to_csv('data/phishing_dataset.csv', index=False)
        return df
    else:
        print("Dataset already exists.")
        return pd.read_csv('data/phishing_dataset.csv')
32
def train():
    df = download_data()
    
    # Simple preprocessing: handle missing values
    df = df.dropna()
    
    # Assuming the dataset has columns: 'text' (email content) and 'label' (0 for safe, 1 for phishing)
    # Note: Column names might vary depending on the dataset source.
    # For this specific dataset, we might need to check column names.
    print(f"Columns: {df.columns.tolist()}")
    
    # In some datasets it's 'Email Text' and 'Email Type'
    text_col = 'text' if 'text' in df.columns else df.columns[0]
    label_col = 'label' if 'label' in df.columns else df.columns[1]

    X = df[text_col]
    y = df[label_col]

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Vectorize text
    print("Vectorizing text...")
    vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)

    # Train model
    print("Training Multinomial Naive Bayes model...")
    model = MultinomialNB()
    model.fit(X_train_tfidf, y_train)

    # Evaluate
    y_pred = model.predict(X_test_tfidf)
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # Save model and vectorizer
    print("Saving model components...")
    joblib.dump(model, 'ml/model.joblib')
    joblib.dump(vectorizer, 'ml/vectorizer.joblib')
    print("Done!")

if __name__ == "__main__":
    train()
