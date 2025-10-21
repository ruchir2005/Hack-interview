#!/bin/bash

# Navigate to the script's directory
cd "$(dirname "$0")"

# Check if virtual environment exists, if not create it
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
else
    # Activate virtual environment
    source venv/bin/activate
fi

# Export environment variables if .env exists
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Start the FastAPI server
echo "Starting FastAPI server..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000
