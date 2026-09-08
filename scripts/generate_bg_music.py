import numpy as np
import wave
import subprocess

SAMPLE_RATE = 44100
DURATION = 125.0  # seconds
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION)

t = np.linspace(0, DURATION, TOTAL_SAMPLES, endpoint=False)

# Chords progression (Fmaj7 -> G -> Am7 -> Em7)
# Frequencies (Hz)
chords = [
    [174.61, 220.00, 261.63, 329.63], # F3, A3, C4, E4
    [196.00, 246.94, 293.66, 329.63], # G3, B3, D4, E4
    [220.00, 261.63, 329.63, 392.00], # A3, C4, E4, G4
    [164.81, 196.00, 246.94, 293.66], # E3, G3, B3, D4
]
chord_duration = 4.0  # 4 seconds per chord

left_channel = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
right_channel = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

# Generate warm pads
for chord_idx, chord in enumerate(chords):
    # Repeat throughout duration
    time_points = np.arange(chord_idx * chord_duration, DURATION, len(chords) * chord_duration)
    for start_t in time_points:
        end_t = min(start_t + chord_duration, DURATION)
        start_idx = int(start_t * SAMPLE_RATE)
        end_idx = int(end_t * SAMPLE_RATE)
        seg_len = end_idx - start_idx
        if seg_len <= 0:
            continue
        
        seg_t = np.linspace(0, end_t - start_t, seg_len, endpoint=False)
        # Envelope: Attack 0.8s, Release 0.8s
        env = np.ones(seg_len, dtype=np.float32)
        attack_samples = int(min(0.8 * SAMPLE_RATE, seg_len / 2))
        release_samples = int(min(0.8 * SAMPLE_RATE, seg_len / 2))
        if attack_samples > 0:
            env[:attack_samples] = np.sin(np.linspace(0, np.pi / 2, attack_samples))
        if release_samples > 0:
            env[-release_samples:] = np.cos(np.linspace(0, np.pi / 2, release_samples))
        
        # Add chord voices with detune for warm chorus
        for i, freq in enumerate(chord):
            # Fundamental + soft harmonics
            w1 = np.sin(2 * np.pi * freq * seg_t)
            w2 = 0.3 * np.sin(2 * np.pi * (freq * 1.004) * seg_t)
            w3 = 0.15 * np.sin(2 * np.pi * (freq * 2) * seg_t)
            voice = (w1 + w2 + w3) * env * 0.12
            
            # Pan slightly across stereo field
            pan = (i / (len(chord) - 1)) * 0.4 + 0.3  # 0.3 to 0.7
            left_channel[start_idx:end_idx] += voice * (1.0 - pan)
            right_channel[start_idx:end_idx] += voice * pan

# Soft sub-bass (root notes)
roots = [87.31, 98.00, 110.00, 82.41]
for r_idx, root_freq in enumerate(roots):
    time_points = np.arange(r_idx * chord_duration, DURATION, len(roots) * chord_duration)
    for start_t in time_points:
        end_t = min(start_t + chord_duration, DURATION)
        start_idx = int(start_t * SAMPLE_RATE)
        end_idx = int(end_t * SAMPLE_RATE)
        seg_len = end_idx - start_idx
        if seg_len <= 0:
            continue
        seg_t = np.linspace(0, end_t - start_t, seg_len, endpoint=False)
        env = np.ones(seg_len, dtype=np.float32)
        att = int(min(0.5 * SAMPLE_RATE, seg_len / 2))
        rel = int(min(0.5 * SAMPLE_RATE, seg_len / 2))
        env[:att] = np.linspace(0, 1, att)
        env[-rel:] = np.linspace(1, 0, rel)
        bass = np.sin(2 * np.pi * root_freq * seg_t) * env * 0.18
        left_channel[start_idx:end_idx] += bass * 0.5
        right_channel[start_idx:end_idx] += bass * 0.5

# High tech subtle arpeggio / electronic pulse (warm bell pluck)
bpm = 110
beat_sec = 60.0 / bpm
step_sec = beat_sec / 2.0  # 8th notes
num_steps = int(DURATION / step_sec)

scale = [349.23, 392.00, 440.00, 523.25, 587.33, 659.25] # F4, G4, A4, C5, D5, E5
np.random.seed(42)

for s in range(num_steps):
    t_start = s * step_sec
    if t_start >= DURATION - 1.0:
        break
    # Skip some beats randomly for space
    if np.random.rand() > 0.65:
        continue
    freq = np.random.choice(scale)
    pluck_len = int(0.35 * SAMPLE_RATE)
    idx_start = int(t_start * SAMPLE_RATE)
    idx_end = min(idx_start + pluck_len, TOTAL_SAMPLES)
    actual_len = idx_end - idx_start
    if actual_len <= 0:
        continue
    pluck_t = np.linspace(0, actual_len / SAMPLE_RATE, actual_len, endpoint=False)
    # Fast attack, exponential decay
    decay = np.exp(-pluck_t * 12.0)
    pluck = (np.sin(2 * np.pi * freq * pluck_t) + 0.3 * np.sin(4 * np.pi * freq * pluck_t)) * decay * 0.07
    
    pan = 0.2 + 0.6 * np.random.rand()
    left_channel[idx_start:idx_end] += pluck * (1.0 - pan)
    right_channel[idx_start:idx_end] += pluck * pan

# Master fade in (2s) and fade out (3s)
fade_in = int(2.0 * SAMPLE_RATE)
fade_out = int(3.0 * SAMPLE_RATE)
left_channel[:fade_in] *= np.linspace(0, 1, fade_in)
right_channel[:fade_in] *= np.linspace(0, 1, fade_in)
left_channel[-fade_out:] *= np.linspace(1, 0, fade_out)
right_channel[-fade_out:] *= np.linspace(1, 0, fade_out)

# Normalize volume to gentle background level (-22 dB RMS)
max_val = max(np.max(np.abs(left_channel)), np.max(np.abs(right_channel)))
if max_val > 0:
    left_channel = (left_channel / max_val) * 0.35
    right_channel = (right_channel / max_val) * 0.35

# Interleave stereo 16-bit PCM
audio_int16 = np.zeros(TOTAL_SAMPLES * 2, dtype=np.int16)
audio_int16[0::2] = (np.clip(left_channel, -1.0, 1.0) * 32767).astype(np.int16)
audio_int16[1::2] = (np.clip(right_channel, -1.0, 1.0) * 32767).astype(np.int16)

wav_path = "demo_recordings/bg_music.wav"
with wave.open(wav_path, "wb") as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SAMPLE_RATE)
    wf.writeframes(audio_int16.tobytes())

# Convert to MP3
mp3_path = "demo_recordings/bg_music.mp3"
subprocess.run(["ffmpeg", "-y", "-i", wav_path, "-b:a", "192k", mp3_path], check=True)
print(f"Generated {mp3_path} successfully!")
