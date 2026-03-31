# 1. THE BASE (The Empty Room)
# We start with a lightweight version of Linux that has Python 3.9 pre-installed.
FROM python:3.9-slim

# 2. THE PLUMBING (System Dependencies)
# We install 'ffmpeg' and 'sndfile'. These are required for Librosa to hear audio.
# Without this, the container is deaf.
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 3. THE WORKSPACE
# We create a folder named 'app' inside the container to hold our code.
WORKDIR /app

# 4. THE FURNITURE (Python Libraries)
# We copy the list and install the libraries.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. THE MOVE-IN (Copy Code)
# We copy everything from your 'ml_service' folder into the container.
COPY . .

# 6. THE DOOR (Expose Port)
# We tell the container to listen on Port 8000.
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
