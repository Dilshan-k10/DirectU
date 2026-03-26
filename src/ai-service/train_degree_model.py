import pickle

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split


def main() -> None:
    #Load dataset
    # The CSV is expected to have at least two columns
    # resume_text: free-text CV / skills description
    # degree_label: target degree program label
    data_path = "cv_dataset.csv"
    df = pd.read_csv(data_path)

    # Basic sanity check
    if "resume_text" not in df.columns or "degree_label" not in df.columns:
        raise ValueError(
            f"Expected columns 'resume_text' and 'degree_label' in {data_path}, "
            f"but found: {list(df.columns)}"
        )

    texts = df["resume_text"].astype(str)
    labels = df["degree_label"].astype(str)

    # Convert all text to lowercase for consistent vectorization.
    texts = texts.str.lower()

    # Feature extraction (TF-IDF)

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        max_features=5000,
    )

    # Fit the vectorizer on the entire training corpus.
    X = vectorizer.fit_transform(texts)

    # Model (LogisticRegression)
    model = LogisticRegression(max_iter=500)


    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, labels, test_size=0.2, random_state=42
    )


    #Training
    model.fit(X_train, y_train)


    #Evaluation
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)

    acc = accuracy_score(y_test, y_pred)
    print("=== Evaluation on Test Set ===")
    print(f"Accuracy: {acc:.4f}")
    print("\nClassification report:")
    print(classification_report(y_test, y_pred))


    # Save artifacts
    # Save model and vectorizer to be used later by FastAPI service.
    with open("degree_model.pkl", "wb") as f_model:
        pickle.dump(model, f_model)

    with open("vectorizer.pkl", "wb") as f_vec:
        pickle.dump(vectorizer, f_vec)

    print("\nSaved 'degree_model.pkl' and 'vectorizer.pkl'.")


    # Simple prediction test
    example_text = "python deep learning ai data science"
    example_text_processed = example_text.lower()

    example_features = vectorizer.transform([example_text_processed])
    example_pred = model.predict(example_features)[0]
    example_proba = model.predict_proba(example_features)[0]

    # Find probability associated with the predicted class
    class_index = list(model.classes_).index(example_pred)
    example_conf = example_proba[class_index]

    print("\n=== Simple Prediction Test ===")
    print(f"Input text: {example_text}")
    print(f"Predicted degree: {example_pred}")
    print(f"Probability score: {example_conf:.4f}")


if __name__ == "__main__":
    main()

