import subprocess
import os
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

RAW_VIDEO = "public/assets/videos/tutorial_demo_orbynex.mp4"
BG_MUSIC = "demo_recordings/bg_music.mp3"
OUTPUT_FINAL = "public/assets/videos/tutorial_demo_orbynex_acelerado.mp4"
OUTPUT_MAIN = "public/assets/videos/tutorial_demo_orbynex.mp4"

# Segment configurations
# (start_src, end_src, speed_multiplier, voice_file, voice_start_timeline, badge_file, badge_label)
segments = [
    {
        "id": 1,
        "start": 0.0,
        "end": 27.0,
        "speed": 1.8,
        "voice": "demo_recordings/part1.mp3",
        "voice_offset": 1.0,
        "badge": "demo_recordings/badge_1.png",
        "label": "01. Portada y Hero Comercial"
    },
    {
        "id": 2,
        "start": 27.0,
        "end": 61.0,
        "speed": 2.0,
        "voice": "demo_recordings/part2.mp3",
        "voice_offset": 1.0,
        "badge": "demo_recordings/badge_2.png",
        "label": "02. Autenticación Split-Screen"
    },
    {
        "id": 3,
        "start": 61.0,
        "end": 149.0,
        "speed": 3.0,
        "voice": "demo_recordings/part3.mp3",
        "voice_offset": 1.0,
        "badge": "demo_recordings/badge_3.png",
        "label": "03. Configuración de Mi Negocio"
    },
    {
        "id": 4,
        "start": 149.0,
        "end": 195.0,
        "speed": 2.5,
        "voice": "demo_recordings/part4.mp3",
        "voice_offset": 1.0,
        "badge": "demo_recordings/badge_4.png",
        "label": "04. Gestión de Clientes Empresariales"
    },
    {
        "id": 5,
        "start": 195.0,
        "end": 261.0,
        "speed": 2.7,
        "voice": "demo_recordings/part5.mp3",
        "voice_offset": 1.0,
        "badge": "demo_recordings/badge_5.png",
        "label": "05. Nueva Cotización en CLP"
    },
    {
        "id": 6,
        "start": 261.0,
        "end": 289.2,
        "speed": 1.7,
        "voice": "demo_recordings/part6.mp3",
        "voice_offset": 1.0,
        "badge": "demo_recordings/badge_6.png",
        "label": "06. Vista Previa y Emisión PDF"
    },
]

print("🎬 Paso 1: Procesando y acelerando los 6 segmentos de video...")

# Calculate timing
timeline_cursor = 0.0
for s in segments:
    raw_dur = s["end"] - s["start"]
    accel_dur = raw_dur / s["speed"]
    s["timeline_start"] = timeline_cursor
    s["timeline_end"] = timeline_cursor + accel_dur
    s["accel_duration"] = accel_dur
    s["voice_timeline_start"] = timeline_cursor + s["voice_offset"]
    timeline_cursor += accel_dur
    print(f"Segmento {s['id']}: [{s['timeline_start']:.2f}s - {s['timeline_end']:.2f}s] (duración: {accel_dur:.2f}s, velocidad: {s['speed']}x)")

total_duration = timeline_cursor
print(f"⏱️ Duración total estimada del video acelerado: {total_duration:.2f}s (~{int(total_duration//60)}m {int(total_duration%60)}s)")

# Export individual retimed video segments
seg_files = []
for s in segments:
    seg_file = f"demo_recordings/seg_{s['id']}.mp4"
    seg_files.append(seg_file)
    pts_factor = 1.0 / s["speed"]
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(s["start"]),
        "-to", str(s["end"]),
        "-i", RAW_VIDEO,
        "-filter:v", f"setpts={pts_factor:.5f}*PTS,fps=30",
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-an",
        seg_file
    ]
    print(f"Renderizando segmento {s['id']}...")
    subprocess.run(cmd, check=True)

# Concatenate segments
concat_list_file = "demo_recordings/concat_list.txt"
with open(concat_list_file, "w") as f:
    for sf in seg_files:
        f.write(f"file '{os.path.abspath(sf)}'\n")

concat_video = "demo_recordings/video_concat.mp4"
cmd_concat = [
    "ffmpeg", "-y",
    "-f", "concat", "-safe", "0",
    "-i", concat_list_file,
    "-c", "copy",
    concat_video
]
print("Concatenando segmentos acelerados...")
subprocess.run(cmd_concat, check=True)

# Paso 2: Superponer los badges de señalización visual en cada segmento
print("🎨 Paso 2: Aplicando Badges y Señalización Visual sobre el video...")
# Build overlay filter chain
# Inputs: 0: concat_video, 1: badge_1, 2: badge_2, 3: badge_3, 4: badge_4, 5: badge_5, 6: badge_6
filter_parts = []
current_stream = "0:v"

for idx, s in enumerate(segments):
    badge_input_idx = idx + 1
    next_stream = f"v{idx+1}"
    t_in = s["timeline_start"] + 0.3
    t_out = s["timeline_end"] - 0.3
    filter_parts.append(
        f"[{current_stream}][{badge_input_idx}:v]overlay=x=1400:y=40:enable='between(t,{t_in:.2f},{t_out:.2f})'[{next_stream}]"
    )
    current_stream = next_stream

filter_complex_str = ";".join(filter_parts)

cmd_overlay = [
    "ffmpeg", "-y",
    "-i", concat_video,
    "-i", segments[0]["badge"],
    "-i", segments[1]["badge"],
    "-i", segments[2]["badge"],
    "-i", segments[3]["badge"],
    "-i", segments[4]["badge"],
    "-i", segments[5]["badge"],
    "-filter_complex", filter_complex_str,
    "-map", f"[{current_stream}]",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
    "demo_recordings/video_overlaid.mp4"
]
print("Renderizando video con señalización...")
subprocess.run(cmd_overlay, check=True)

# Paso 3: Construcción de la pista maestra de audio (Locución + Música de fondo)
print("🎙️ Paso 3: Mezclando locución y música de fondo con atenuación...")
# Combine 6 voices with delays
# adelay uses milliseconds: adelay=delay_ms|delay_ms
voice_inputs = []
delay_filters = []
for idx, s in enumerate(segments):
    voice_inputs.extend(["-i", s["voice"]])
    delay_ms = int(s["voice_timeline_start"] * 1000)
    delay_filters.append(f"[{idx}:a]adelay={delay_ms}|{delay_ms}[v{idx}]")

amix_inputs = "".join([f"[v{i}]" for i in range(len(segments))])
voice_filter_str = ";".join(delay_filters) + f";{amix_inputs}amix=inputs={len(segments)}:dropout_transition=0,volume=2.2[voice_master]"

voice_master_file = "demo_recordings/voice_master.wav"
cmd_voice_master = [
    "ffmpeg", "-y",
    *voice_inputs,
    "-filter_complex", voice_filter_str,
    "-map", "[voice_master]",
    voice_master_file
]
print("Generando pista maestra de locución...")
subprocess.run(cmd_voice_master, check=True)

# Final Mix: Voice Master + Background Music
# Ducking: voice master at 1.0, background music at 0.16
audio_master_file = "demo_recordings/final_soundtrack.mp3"
cmd_mix_audio = [
    "ffmpeg", "-y",
    "-i", voice_master_file,
    "-i", BG_MUSIC,
    "-filter_complex", "[0:a]volume=1.0[v];[1:a]volume=0.18[m];[v][m]amix=inputs=2:duration=first:dropout_transition=2[aout]",
    "-map", "[aout]",
    "-t", str(total_duration),
    audio_master_file
]
print("Mezclando locución con música de fondo...")
subprocess.run(cmd_mix_audio, check=True)

# Paso 4: Ensamble final de Video + Audio
print("🚀 Paso 4: Ensamblando Video Acelerado + Audio Master...")
cmd_final = [
    "ffmpeg", "-y",
    "-i", "demo_recordings/video_overlaid.mp4",
    "-i", audio_master_file,
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k",
    "-shortest",
    OUTPUT_FINAL
]
subprocess.run(cmd_final, check=True)

# Also update the main file if not locked by media player
try:
    cmd_copy_main = [
        "ffmpeg", "-y",
        "-i", OUTPUT_FINAL,
        "-c", "copy",
        OUTPUT_MAIN
    ]
    subprocess.run(cmd_copy_main, check=True)
except Exception as e:
    print(f"Nota: El archivo principal {OUTPUT_MAIN} está siendo usado por el reproductor. El video final se encuentra en {OUTPUT_FINAL}")

print(f"\n✅ Video acelerado producido con éxito en:")
print(f"👉 {OUTPUT_FINAL}")

# Output new timestamps
new_timestamps = []
for s in segments:
    mins = int(s["timeline_start"] // 60)
    secs = int(s["timeline_start"] % 60)
    formatted = f"{mins:02d}:{secs:02d}"
    new_timestamps.append({
        "time": formatted,
        "label": s["label"],
        "seconds": round(s["timeline_start"], 2)
    })

with open("public/assets/videos/timestamps_acelerado.json", "w", encoding="utf-8") as f:
    json.dump(new_timestamps, f, indent=2, ensure_ascii=False)

print("\n=======================================================")
print("📋 NUEVO ÍNDICE DE TIEMPOS (VIDEO ACELERADO ~2:00 MIN):")
print("=======================================================")
for item in new_timestamps:
    print(f"- **{item['time']}** : {item['label']}")
print("=======================================================\n")
