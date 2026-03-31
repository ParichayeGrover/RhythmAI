import sys
import os

# Set Keras backend to PyTorch before importing
os.environ['KERAS_BACKEND'] = 'torch'
# Disable numba caching to avoid compilation issues
os.environ['NUMBA_CACHE_DIR'] = ''
os.environ['NUMBA_DISABLE_JIT'] = '0'

from ml_services.composer import RhythmComposer

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python run_composer.py <input_audio_file> <output_midi_file>")
        sys.exit(1)

    input_audio = sys.argv[1]
    output_midi = sys.argv[2]

    if not os.path.exists(input_audio):
        print(f"Input audio file '{input_audio}' does not exist.")
        sys.exit(1)

    composer = RhythmComposer()
    try:
        composer.generate_bassline(input_audio, output_midi)
        print(f"MIDI file generated: {output_midi}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
