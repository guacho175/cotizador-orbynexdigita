import subprocess
import os
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

RAW_VIDEO = "public/assets/videos/demo_asistente_ia_orbynex.mp4"
BG_MUSIC = "demo_recordings/bg_music.mp3"
OUTPUT_SONORIZADO = "public/assets/videos/demo_asistente_ia_orbynex_sonorizado.mp4"

# 5 Bloques clave para el video de IA
# Raw duration is ~185.6s
segments = [
    {
        "id": 1,
        "start": 0.0,
        "end": 54.0,  # Login + Subida de logo
        "speed": 2.1,
        "voice_text": "Te presentamos el verdadero superpoder de Cotizador Orbynex Digital. En Mi Negocio, puedes cargar el logotipo oficial de tu empresa y personalizar tu identidad comercial en segundos para que aparezca en cada cotización.",
        "badge_step": "01",
        "badge_title": "SUBIDA DE LOGO CORPORATIVO",
        "badge_sub": "MI NEGOCIO & IDENTIDAD VISUAL"
    },
    {
        "id": 2,
        "start": 54.0,
        "end": 91.0,  # Clientes + inicio cotización
        "speed": 2.0,
        "voice_text": "Gestiona tu cartera de clientes y abre una nueva cotización seleccionando la empresa destinataria.",
        "badge_step": "02",
        "badge_title": "CARTERA Y NUEVA COTIZACIÓN",
        "badge_sub": "GESTIÓN COMERCIAL RÁPIDA"
    },
    {
        "id": 3,
        "start": 91.0,
        "end": 117.0, # Input 'pagina web' -> Magia IA
        "speed": 1.25, # A velocidad casi normal para apreciar la magia
        "voice_text": "Aquí comienza la magia: con solo escribir una frase breve y ambigua como 'página web' y presionar 'Mejorar redacción', la inteligencia artificial genera en un instante una propuesta comercial completa con diseño responsivo, SEO y alcance técnico paso a paso.",
        "badge_step": "03",
        "badge_title": "ASISTENTE IA: DE 'PÁGINA WEB' A PROPUESTA TÉCNICA",
        "badge_sub": "TRANSFORMACIÓN MÁGICA CON UN CLIC"
    },
    {
        "id": 4,
        "start": 117.0,
        "end": 159.0, # Input 'tarjetas de presentacion' -> Magia IA
        "speed": 1.35, # Velocidad moderada para leer las especificaciones
        "voice_text": "Lo mismo ocurre con productos específicos. Solo escribes 'tarjetas de presentación', presionas el asistente, y obtienes una especificación técnica de imprenta con papel couché, termolaminado y procesos de control de calidad.",
        "badge_step": "04",
        "badge_title": "ASISTENTE IA: 'TARJETAS DE PRESENTACIÓN' PREMIUM",
        "badge_sub": "DESGLOSE DE IMPRENTA Y PRODUCCIÓN"
    },
    {
        "id": 5,
        "start": 159.0,
        "end": 185.6, # Vista previa PDF + Descarga
        "speed": 1.5,
        "voice_text": "El resultado final es una propuesta ejecutiva en PDF que luce el logotipo de tu empresa, partidas comerciales redactadas por IA y cálculo de totales en pesos chilenos, lista para cerrar ventas.",
        "badge_step": "05",
        "badge_title": "PDF DEFINITIVO CON LOGO E IA",
        "badge_sub": "EMISIÓN OFICIAL Y CIERRE DE NEGOCIOS"
    }
]

print("🎙️ Paso 1: Generando clips de voz en español de Chile con edge-tts...")
os.makedirs("demo_recordings/ai_showcase/audio", exist_ok=True)
voice = "es-CL-LorenzoNeural"

for s in segments:
    voice_file = f"demo_recordings/ai_showcase/audio/voice_{s['id']}.mp3"
    s["voice_file"] = voice_file
    cmd = ["edge-tts", "--voice", voice, "--text", s["voice_text"], "--write-media", voice_file]
    subprocess.run(cmd, check=True)
    print(f"Clip {s['id']} generado.")

print("\n🎨 Paso 2: Renderizando Badges gráficos transparentes...")
# Usar Node / Playwright para renderizar badges
badges_data = [
    {
        "id": s["id"],
        "step": s["badge_step"],
        "title": s["badge_title"],
        "subtitle": s["badge_sub"]
    }
    for s in segments
]
with open("demo_recordings/ai_showcase/badges.json", "w", encoding="utf-8") as f:
    json.dump(badges_data, f, ensure_ascii=False)

render_script = """
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const badges = JSON.parse(fs.readFileSync("demo_recordings/ai_showcase/badges.json", "utf8"));

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 750, height: 200 } });

  for (const b of badges) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 16px; background: transparent; display: inline-block; }
          .badge {
            display: inline-flex; align-items: center; gap: 14px;
            background: rgba(10, 15, 30, 0.94);
            border: 1.5px solid rgba(14, 165, 233, 0.7);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(14, 165, 233, 0.4);
            padding: 12px 22px; border-radius: 16px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .icon {
            display: flex; align-items: center; justify-content: center;
            width: 38px; height: 38px; border-radius: 12px;
            background: linear-gradient(135deg, #0ea5e9 0%, #ec4899 100%);
            color: #ffffff; font-weight: 800; font-size: 15px;
            box-shadow: 0 2px 10px rgba(236, 72, 153, 0.4);
          }
          .content { display: flex; flex-direction: column; gap: 2px; }
          .subtitle { font-size: 10px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 1.2px; }
          .title { font-size: 14px; font-weight: 800; color: #ffffff; letter-spacing: -0.2px; }
        </style>
      </head>
      <body>
        <div class="badge" id="b">
          <div class="icon">${b.step}</div>
          <div class="content">
            <div class="subtitle">${b.subtitle}</div>
            <div class="title">${b.title}</div>
          </div>
        </div>
      </body>
      </html>
    `;
    await page.setContent(html);
    const el = page.locator("#b");
    const out = path.resolve(`demo_recordings/ai_showcase/badge_${b.id}.png`);
    await el.screenshot({ path: out, omitBackground: true });
    console.log(`Badge ${b.id} guardado.`);
  }
  await browser.close();
}
run();
"""
with open("demo_recordings/ai_showcase/render_badges.mjs", "w", encoding="utf-8") as f:
    f.write(render_script)

subprocess.run(["node", "demo_recordings/ai_showcase/render_badges.mjs"], check=True)

print("\n🎬 Paso 3: Acelerando segmentos de video y concatenando...")
timeline_cursor = 0.0
seg_files = []
for s in segments:
    raw_dur = s["end"] - s["start"]
    accel_dur = raw_dur / s["speed"]
    s["timeline_start"] = timeline_cursor
    s["timeline_end"] = timeline_cursor + accel_dur
    s["accel_duration"] = accel_dur
    s["badge_file"] = f"demo_recordings/ai_showcase/badge_{s['id']}.png"
    timeline_cursor += accel_dur
    
    seg_file = f"demo_recordings/ai_showcase/seg_{s['id']}.mp4"
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
    subprocess.run(cmd, check=True)
    print(f"Segmento {s['id']}: [{s['timeline_start']:.1f}s - {s['timeline_end']:.1f}s] ({accel_dur:.1f}s a {s['speed']}x)")

total_duration = timeline_cursor
print(f"⏱️ Duración final del video: {total_duration:.1f}s (~{int(total_duration//60)}m {int(total_duration%60)}s)")

concat_list = "demo_recordings/ai_showcase/concat.txt"
with open(concat_list, "w") as f:
    for sf in seg_files:
        f.write(f"file '{os.path.abspath(sf)}'\n")

concat_video = "demo_recordings/ai_showcase/video_concat.mp4"
subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_list, "-c", "copy", concat_video], check=True)

print("\n🎨 Paso 4: Superponiendo badges sobre el video...")
filter_parts = []
current_stream = "0:v"
for idx, s in enumerate(segments):
    badge_idx = idx + 1
    next_stream = f"v{idx+1}"
    t_in = s["timeline_start"] + 0.3
    t_out = s["timeline_end"] - 0.3
    filter_parts.append(
        f"[{current_stream}][{badge_idx}:v]overlay=x=1360:y=40:enable='between(t,{t_in:.2f},{t_out:.2f})'[{next_stream}]"
    )
    current_stream = next_stream

badge_inputs = []
for s in segments:
    badge_inputs.extend(["-i", s["badge_file"]])

overlaid_video = "demo_recordings/ai_showcase/video_overlaid.mp4"
cmd_overlay = [
    "ffmpeg", "-y",
    "-i", concat_video,
    *badge_inputs,
    "-filter_complex", ";".join(filter_parts),
    "-map", f"[{current_stream}]",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
    overlaid_video
]
subprocess.run(cmd_overlay, check=True)

print("\n🎙️ Paso 5: Mezclando locución con música ambiental...")
voice_inputs = []
delay_filters = []
for idx, s in enumerate(segments):
    voice_inputs.extend(["-i", s["voice_file"]])
    delay_ms = int((s["timeline_start"] + 0.6) * 1000)
    delay_filters.append(f"[{idx}:a]adelay={delay_ms}|{delay_ms}[v{idx}]")

amix_inputs = "".join([f"[v{i}]" for i in range(len(segments))])
voice_filter = ";".join(delay_filters) + f";{amix_inputs}amix=inputs={len(segments)}:dropout_transition=0,volume=2.2[vm]"

voice_master = "demo_recordings/ai_showcase/voice_master.wav"
subprocess.run(["ffmpeg", "-y", *voice_inputs, "-filter_complex", voice_filter, "-map", "[vm]", voice_master], check=True)

audio_master = "demo_recordings/ai_showcase/soundtrack.mp3"
cmd_mix = [
    "ffmpeg", "-y",
    "-i", voice_master,
    "-i", BG_MUSIC,
    "-filter_complex", "[0:a]volume=1.0[v];[1:a]volume=0.18[m];[v][m]amix=inputs=2:duration=first:dropout_transition=2[aout]",
    "-map", "[aout]",
    "-t", str(total_duration),
    audio_master
]
subprocess.run(cmd_mix, check=True)

print("\n🚀 Paso 6: Renderizando video final...")
cmd_final = [
    "ffmpeg", "-y",
    "-i", overlaid_video,
    "-i", audio_master,
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k",
    "-shortest",
    OUTPUT_SONORIZADO
]
subprocess.run(cmd_final, check=True)

print(f"\n✅ Video terminado y disponible en:")
print(f"👉 {OUTPUT_SONORIZADO}")

timestamps_res = []
for s in segments:
    mins = int(s["timeline_start"] // 60)
    secs = int(s["timeline_start"] % 60)
    timestamps_res.append({
        "time": f"{mins:02d}:{secs:02d}",
        "label": f"{s['badge_step']}. {s['badge_title']}",
        "seconds": round(s["timeline_start"], 2)
    })

with open("public/assets/videos/timestamps_ai_sonorizado.json", "w", encoding="utf-8") as f:
    json.dump(timestamps_res, f, indent=2, ensure_ascii=False)

print("\n=======================================================")
print("📋 ÍNDICE DE TIEMPOS (VIDEO SHOWCASE DE IA):")
print("=======================================================")
for item in timestamps_res:
    print(f"- **{item['time']}** : {item['label']}")
print("=======================================================\n")
