# ml_service/app.py
import os
# Set environment variables before importing other modules
os.environ['KERAS_BACKEND'] = 'torch'
os.environ['MPLBACKEND'] = 'Agg'
os.environ['NUMBA_CACHE_DIR'] = ''
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import shutil
from composer import RhythmComposer

# 1. Initialize the App
app = FastAPI(title="RhythmAI Service", version="1.0")

# 2. Initialize the Brain (Load Model once at startup)
# We do this here so we don't reload the model for every single request
composer = RhythmComposer()

# 3. Define the Endpoint (The "Waiter")
@app.post("/generate_bassline")
async def generate_bassline_endpoint(file: UploadFile = File(...)):
    """
    Receives a Drum Audio file -> Returns a MIDI Bassline file
    """
    temp_filename = f"temp_{file.filename}"
    output_midi = f"bassline_{os.path.splitext(file.filename)[0]}.mid"

    try:
        # A. Save the uploaded file temporarily
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # B. Run the AI Logic
        generated_file = composer.generate_bassline(temp_filename, output_midi)
        
        # C. Return the result
        return FileResponse(generated_file, media_type="audio/midi", filename=output_midi)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # D. Cleanup (Delete the temp audio file)
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

# 4. Run Instruction
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)