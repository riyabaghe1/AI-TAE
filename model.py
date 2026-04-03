import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore")

def load_data(symbol, period='1y'):
    try:
        # Fetch data
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period)
        
        if df.empty:
            return None, "No data found for symbol. Please check the spelling."
            
        df = df.dropna()
        return df, None
    except Exception as e:
        return None, str(e)

def prepare_features(df):
    data = df.copy()
    
    # Calculate daily returns
    data['Return'] = data['Close'].pct_change()
    
    # Moving Averages
    data['MA_5'] = data['Close'].rolling(window=5).mean()
    data['MA_20'] = data['Close'].rolling(window=20).mean()
    
    # Volatility
    data['Volatility'] = data['Return'].rolling(window=20).std()
    
    data = data.dropna()
    return data

def train_and_predict(df):
    data = prepare_features(df)
    
    if len(data) < 30:
        return None, None, "Not enough data points to train the model."
        
    # Target: 1 if tomorrow's close is higher than today's close, else 0 (Uptrend vs Downtrend)
    data['Target'] = np.where(data['Close'].shift(-1) > data['Close'], 1, 0)
    
    # We will use the last row for prediction, and all previous rows for training
    features = ['Return', 'MA_5', 'MA_20', 'Volatility']
    
    X = data[features].values[:-1]
    y = data['Target'].values[:-1]
    
    X_latest = data[features].values[-1:]
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_latest_scaled = scaler.transform(X_latest)
    
    # Train Logistic Regression model for probabilistic output
    model = LogisticRegression(random_state=42, class_weight='balanced')
    model.fit(X_scaled, y)
    
    # Predict the latest
    prediction = model.predict(X_latest_scaled)[0]
    probabilities = model.predict_proba(X_latest_scaled)[0]
    
    # Probability of the predicted class
    confidence = probabilities[prediction]
    
    trend = "Uptrend" if prediction == 1 else "Downtrend"
    
    if np.abs(probabilities[0] - probabilities[1]) < 0.05:
        # Small margin means somewhat stable/uncertain
        trend = "Stable"
    
    return trend, confidence * 100, None

def analyze_stock(symbol):
    df, error = load_data(symbol)
    if error:
        return {"error": error}
        
    trend, confidence, error = train_and_predict(df)
    if error:
        return {"error": error}
        
    # Format data for frontend charting (last 60 days for better visual)
    chart_data = df.tail(60).reset_index()
    # Handle timezone awareness if present
    if pd.api.types.is_datetime64_any_dtype(chart_data['Date']):
        chart_data['Date'] = chart_data['Date'].dt.date
    
    chart_data['Date'] = chart_data['Date'].astype(str)
    
    hist_prices = chart_data['Close'].tolist()
    dates = chart_data['Date'].tolist()
    
    return {
        "symbol": symbol.upper(),
        "trend": trend,
        "confidence": round(confidence, 2),
        "historical_dates": dates,
        "historical_prices": [round(x, 2) for x in hist_prices]
    }
