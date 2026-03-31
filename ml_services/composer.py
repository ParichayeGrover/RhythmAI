# ml_service/composer.py
import matplotlib
matplotlib.use('Agg')  # Set non-interactive backend BEFORE importing pyplot
import matplotlib.pyplot as plt

import librosa
import librosa.display
import numpy as np
import keras
import mido
from mido import Message, MetaMessage, MidiFile, MidiTrack
import cv2
import io
import os

# Define Constants
CLASS_MAP = {0: 'hat', 1: 'kick', 2: 'snare'}
NOTE_C_MAJOR = [60, 62, 64, 65, 67, 69, 71]

class RhythmComposer:
    def __init__(self, model_path='drum_cnn_model.keras'):
        # Determine the absolute path to ensure we find the model
        base_dir = os.path.dirname(os.path.abspath(__file__))
        full_model_path = os.path.join(base_dir, model_path)
        
        print(f"Loading model from {full_model_path}...")
        try:
            self.model = keras.models.load_model(full_model_path)
            print("Model loaded successfully.")
        except (OSError, IOError) as e:
            print(f"Error: Could not find model at {full_model_path}")
            print(f"Exception: {e}")
            self.model = None

    def _create_spectrogram(self, y_clip, sr):
        """Internal helper to create the exact spectrogram image"""
        # Silence check
        if np.max(np.abs(y_clip)) < 0.005:
            return None

        # 1. Mel-Spectrogram
        spectrogram = librosa.feature.melspectrogram(y=y_clip, sr=sr, n_mels=128)
        log_spectrogram = librosa.power_to_db(spectrogram, ref=np.max)

        # 2. Plotting (The "Eye")
        plt.ioff()
        fig = plt.figure(figsize=(3, 3))
        ax = fig.add_axes([0, 0, 1, 1])
        ax.axis('off')
        librosa.display.specshow(log_spectrogram, sr=sr, ax=ax)

        # 3. Save to RAM
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
        plt.close(fig)
        buf.seek(0)

        # 4. Convert to Array
        img_arr = np.frombuffer(buf.getvalue(), dtype=np.uint8)
        img = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
        img = cv2.resize(img, (128, 128))
        img = img / 255.0
        img = img.reshape(1, 128, 128, 3)
        return img

    def _get_bass_note(self, class_id):
        label = CLASS_MAP[class_id]
        if label == 'kick': return NOTE_C_MAJOR[0]   # C
        elif label == 'snare': return NOTE_C_MAJOR[4] # G
        elif label == 'hat': return NOTE_C_MAJOR[2]   # E
        return None

    def generate_bassline(self, audio_file_path, output_midi_path):
        if self.model is None:
            raise RuntimeError("Model not loaded! Cannot generate bassline.")

        print(f"Processing {audio_file_path}...")
        y, sr = librosa.load(audio_file_path, sr=None)
        
        # Detect Beats
        onset_frames = librosa.onset.onset_detect(y=y, sr=sr)
        onset_times = librosa.frames_to_time(onset_frames, sr=sr)
        
        # Setup MIDI
        mid = MidiFile()
        track = MidiTrack()
        mid.tracks.append(track)
        track.append(MetaMessage('set_tempo', tempo=mido.bpm2tempo(120)))
        
        absolute_midi_time_sec = 0.0
        
        for i, onset_frame in enumerate(onset_frames):
            beat_time_sec = onset_times[i]
            
            # Extract Clip
            start_sample = librosa.frames_to_samples(onset_frame)
            end_sample = start_sample + int(sr * 0.2)
            y_clip = y[start_sample:end_sample]
            
            if len(y_clip) < int(sr * 0.2):
                y_clip = librosa.util.fix_length(y_clip, size=int(sr * 0.2))

            # Predict
            input_img = self._create_spectrogram(y_clip, sr)
            if input_img is None: continue

            prediction_probs = self.model.predict(input_img, verbose=0)
            predicted_class_id = np.argmax(prediction_probs)
            
            # Compose
            note_to_play = self._get_bass_note(predicted_class_id)
            
            if note_to_play:
                delay_sec = max(0.0, beat_time_sec - absolute_midi_time_sec)
                delay_ticks = mido.second2tick(delay_sec, mid.ticks_per_beat, mido.bpm2tempo(120))
                duration_ticks = mido.second2tick(0.15, mid.ticks_per_beat, mido.bpm2tempo(120))
                
                track.append(Message('note_on', note=note_to_play, velocity=100, time=round(delay_ticks)))
                track.append(Message('note_off', note=note_to_play, velocity=64, time=round(duration_ticks)))
                
                absolute_midi_time_sec = beat_time_sec + 0.15
        
        mid.save(output_midi_path)
        print(f"Generated MIDI saved to {output_midi_path}")
        return output_midi_path