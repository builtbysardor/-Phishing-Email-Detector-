import pandas as pd
import os

def create_synthetic_data():
    data = {
        'text': [
            "Hi, how are you today?",
            "Meeting at 5 PM in the conference room.",
            "Please find the attached invoice for your purchase.",
            "Check out this new recipe I found!",
            "URGENT: Your bank account has been compromised. Click here to secure it now!",
            "Congratulations! You've won a $1000 Walmart gift card. Claim here.",
            "Verify your account details immediately to avoid suspension.",
            "PayPal: Security alert! Unusual activity detected. Log in now.",
            "The weather today is great for a walk.",
            "Don't forget the milk on your way home.",
            "ACT NOW: Limited time offer for free Bitcoin!",
            "Subject: Your Amazon order #123-456 has been shipped.",
            "Update your Apple ID password by clicking this link.",
            "Hi, let's catch up over coffee sometime.",
            "Winner! You are selected for a free trip to Hawaii."
        ],
        'label': [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1]
    }
    
    # Repeat data to have enough for training
    df = pd.DataFrame(data)
    df = pd.concat([df] * 5, ignore_index=True)
    
    if not os.path.exists('data'):
        os.makedirs('data')
    
    df.to_csv('data/phishing_dataset.csv', index=False)
    print("Synthetic dataset created successfully.")

if __name__ == "__main__":
    create_synthetic_data()
