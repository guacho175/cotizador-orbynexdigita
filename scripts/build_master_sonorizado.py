import subprocess
import os
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

RAW_VIDEO = "public/assets/videos/tutorial_demo_orbynex_master.mp4"
BG_MUSIC = "demo_recordings/bg_music.mp3"
OUTPUT_SONORIZADO = "public/assets/videos/tutorial_demo_orbynex_master_sonorizado.mp4"
TIMESTAMPS_OUTPUT = "public/assets/videos/timestamps_master_sonorizado.json"
WORK_DIR = "demo_recordings/master_sonorizado"

os.makedirs(f"{WORK_DIR}/audio", exist_ok=True)
os.makedirs(f"{WORK_DIR}/badges", exist_ok=True)

segments = [
    {
        "id": 1,
        "start": 0.0,
        "end": 22.0,
        "speed": 1.3,
        "voice_text": "Bienvenido a Cotizador Orbynex Digital, la plataforma en la nube diseñada para agilizar tu flujo de ventas y emitir cotizaciones comerciales de alto impacto.",
        "badge_step": "01",
        "badge_title": "COTIZADOR ORBYNEX DIGITAL",
        "badge_sub": "PLATAFORMA COMERCIAL SAAS"
    },
    {
        "id": 2,
        "start": 22.0,
        "end": 54.0,
        "speed": 1.35,
        "voice_text": "Comenzar es muy simple. En la pestaña Crear Cuenta ingresamos el nombre, correo electrónico y contraseña con verificación visual, obteniendo acceso instantáneo al panel principal.",
        "badge_step": "02",
        "badge_title": "REGISTRO DE CUENTA EN VIVO",
        "badge_sub": "ACCESO INSTANTÁNEO AL PANEL"
    },
    {
        "id": 3,
        "start": 54.0,
        "end": 129.0,
        "speed": 1.85,
        "voice_text": "En el módulo Mi Negocio configuramos la identidad corporativa. Subimos el logotipo oficial de la empresa para personalizar la cabecera y completamos los datos de facturación, condiciones comerciales y cuentas bancarias.",
        "badge_step": "03",
        "badge_title": "SUBIDA DE LOGO CORPORATIVO",
        "badge_sub": "MI NEGOCIO & DATOS DE FACTURACIÓN"
    },
    {
        "id": 4,
        "start": 129.0,
        "end": 173.0,
        "speed": 1.65,
        "voice_text": "En la sección de Clientes registramos a Inversiones del Maule, configurando su RUT, giro comercial y correo de contacto en un flujo limpio y sin duplicados.",
        "badge_step": "04",
        "badge_title": "CARTERA DE CLIENTES",
        "badge_sub": "REGISTRO CENTRALIZADO"
    },
    {
        "id": 5,
        "start": 173.0,
        "end": 215.0,
        "speed": 1.15,
        "voice_text": "Al crear una cotización descubrimos el verdadero superpoder del sistema. Basta con escribir un concepto breve como 'página web' y presionar 'Mejorar redacción': la inteligencia artificial lo convierte al instante en una propuesta comercial completa con arquitectura, diseño responsivo y optimización SEO.",
        "badge_step": "05",
        "badge_title": "ASISTENTE IA: 'PÁGINA WEB'",
        "badge_sub": "TRANSFORMACIÓN A PROPUESTA TÉCNICA"
    },
    {
        "id": 6,
        "start": 215.0,
        "end": 253.0,
        "speed": 1.2,
        "voice_text": "La IA se adapta a cualquier industria. Agregamos una segunda partida con 'tarjetas de presentación' y el asistente genera automáticamente una ficha técnica de imprenta con papel couché de 350 gramos, termolaminado mate y control de calidad.",
        "badge_step": "06",
        "badge_title": "ASISTENTE IA: 'TARJETAS DE PRESENTACIÓN'",
        "badge_sub": "FICHA DE IMPRENTA Y PRODUCCIÓN"
    },
    {
        "id": 7,
        "start": 253.0,
        "end": 280.5,
        "speed": 1.15,
        "voice_text": "En la vista previa en vivo revisamos el documento ejecutivo con el logotipo de la empresa, partidas redactadas con inteligencia artificial y cálculo automático de totales con IVA en pesos chilenos. Emitimos la cotización oficial y descargamos el archivo PDF, listo para enviar y cerrar la venta con tu cliente.",
        "badge_step": "07",
        "badge_title": "VISTA PREVIA PDF & EMISIÓN",
        "badge_sub": "DOCUMENTO OFICIAL CON LOGO E IVA"
    }
]

print("🎙️ Paso 1: Generando clips de voz en español chileno con edge-tts...")
voice = "es-CL-LorenzoNeural"

for s in segments:
    voice_file = f"{WORK_DIR}/audio/voice_{s['id']}.mp3"
    s["voice_file"] = voice_file
    cmd = ["edge-tts", "--voice", voice, "--text", s["voice_text"], "--write-media", voice_file]
    subprocess.run(cmd, check=True)
    
    probe_cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", voice_file]
    v_dur = float(subprocess.check_output(probe_cmd).decode("utf-8").strip())
    s["voice_dur"] = v_dur
    print(f"Clip {s['id']}: {v_dur:.2f}s generado.")

print("\n🎨 Paso 2: Renderizando Badges gráficos transparentes...")
badges_data = [
    {
        "id": s["id"],
        "step": s["badge_step"],
        "title": s["badge_title"],
        "subtitle": s["badge_sub"]
    }
    for s in segments
]
with open(f"{WORK_DIR}/badges.json", "w", encoding="utf-8") as f:
    json.dump(badges_data, f, ensure_ascii=False)

render_script = f"""
import {{ chromium }} from "playwright";
import fs from "node:fs";
import path from "node:path";

const badges = JSON.parse(fs.readFileSync("{WORK_DIR}/badges.json", "utf8"));

async function run() {{
  const browser = await chromium.launch({{ channel: "chrome", headless: true }});
  const page = await browser.newPage({{ viewport: {{ width: 850, height: 200 }} }});

  for (const b of badges) {{
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {{ margin: 0; padding: 16px; background: transparent; display: inline-block; }}
          .badge {{
            display: inline-flex; align-items: center; gap: 14px;
            background: rgba(10, 15, 30, 0.94);
            border: 1.5px solid rgba(14, 165, 233, 0.7);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(14, 165, 233, 0.4);
            padding: 12px 22px; border-radius: 16px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }}
          .icon {{
            display: flex; align-items: center; justify-content: center;
            width: 38px; height: 38px; border-radius: 12px;
            background: linear-gradient(135deg, #0ea5e9 0%, #ec4899 100%);
            color: #ffffff; font-weight: 800; font-size: 15px;
            box-shadow: 0 2px 10px rgba(236, 72, 153, 0.4);
          }}
          .content {{ display: flex; flex-direction: column; gap: 2px; }}
          .subtitle {{ font-size: 10px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 1.2px; }}
          .title {{ font-size: 14px; font-weight: 800; color: #ffffff; letter-spacing: -0.2px; }}
        </style>
      </head>
      <body>
        <div class="badge" id="b">
          <div class="icon">${{b.step}}</div>
          <div class="content">
            <div class="subtitle">${{b.subtitle}}</div>
            <div class="title">${{b.title}}</div>
          </div>
        </div>
      </body>
      </html>
    `;
    await page.setContent(html);
    const el = page.locator("#b");
    const out = path.resolve("{WORK_DIR}/badges/badge_" + b.id + ".png");
    await el.screenshot({{ path: out, omitBackground: true }});
    console.log(`Badge ${{b.id}} guardado.`);
  }}
  await browser.close();
}}
run();
"""
with open(f"{WORK_DIR}/render_badges.mjs", "w", encoding="utf-8") as f:
    f.write(render_script)

subprocess.run(["node", f"{WORK_DIR}/render_badges.mjs"], check=True)

print("\n🎬 Paso 3: Acelerando segmentos de video y concatenando...")
timeline_cursor = 0.0
seg_files = []
for s in segments:
    raw_dur = s["end"] - s["start"]
    accel_dur = raw_dur / s["speed"]
    s["timeline_start"] = timeline_cursor
    s["timeline_end"] = timeline_cursor + accel_dur
    s["accel_duration"] = accel_dur
    s["badge_file"] = f"{WORK_DIR}/badges/badge_{s['id']}.png"
    timeline_cursor += accel_dur
    
    seg_file = f"{WORK_DIR}/seg_{s['id']}.mp4"
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
    print(f"Segmento {s['id']}: [{s['timeline_start']:.1f}s - {s['timeline_end']:.1f}s] ({accel_dur:.1f}s a {s['speed']}x) - Audio voz: {s['voice_dur']:.1f}s")

total_duration = timeline_cursor
mins = int(total_duration // 60)
secs = int(total_duration % 60)
print(f"⏱️ Duración final del video: {total_duration:.2f}s (~{mins}m {secs:02d}s)")

concat_list = f"{WORK_DIR}/concat.txt"
with open(concat_list, "w") as f:
    for sf in seg_files:
        f.write(f"file '{os.path.abspath(sf)}'\n")

concat_video = f"{WORK_DIR}/video_concat.mp4"
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
        f"[{current_stream}][{badge_idx}:v]overlay=x=1450:y=35:enable='between(t,{t_in:.2f},{t_out:.2f})'[{next_stream}]"
    )
    current_stream = next_stream

badge_inputs = []
for s in segments:
    badge_inputs.extend(["-i", s["badge_file"]])

overlaid_video = f"{WORK_DIR}/video_overlaid.mp4"
cmd_overlay = [
    "ffmpeg", "-y",
    "-i", concat_video,
    *badge_inputs,
    "-filter_complex", ";".join(filter_parts),
    "-map", f"[{current_stream}]",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    overlaid_video
]
subprocess.run(cmd_overlay, check=True)

print("\n🎙️ Paso 5: Mezclando locución con música ambiental continua...")
voice_inputs = []
delay_filters = []
for idx, s in enumerate(segments):
    voice_inputs.extend(["-i", s["voice_file"]])
    delay_ms = int((s["timeline_start"] + 0.6) * 1000)
    delay_filters.append(f"[{idx}:a]adelay={delay_ms}|{delay_ms}[v{idx}]")

amix_inputs = "".join([f"[v{i}]" for i in range(len(segments))])
voice_filter = ";".join(delay_filters) + f";{amix_inputs}amix=inputs={len(segments)}:dropout_transition=0,volume=2.2[vm]"

voice_master = f"{WORK_DIR}/voice_master.wav"
subprocess.run(["ffmpeg", "-y", *voice_inputs, "-filter_complex", voice_filter, "-map", "[vm]", voice_master], check=True)

audio_master = f"{WORK_DIR}/soundtrack.mp3"
fade_out_start = max(0, total_duration - 4.0)
cmd_mix = [
    "ffmpeg", "-y",
    "-i", voice_master,
    "-stream_loop", "-1", "-i", BG_MUSIC,
    "-filter_complex",
    f"[0:a]apad=pad_dur=30,volume=1.0[v];[1:a]volume=0.18,afade=t=out:st={fade_out_start:.2f}:d=3.8[m];[v][m]amix=inputs=2:duration=first:dropout_transition=2[aout]",
    "-map", "[aout]",
    "-t", f"{total_duration:.2f}",
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
    "-t", f"{total_duration:.2f}",
    OUTPUT_SONORIZADO
]
subprocess.run(cmd_final, check=True)

print(f"\n✅ Video terminado y disponible en:")
print(f"👉 {OUTPUT_SONORIZADO}")

timestamps_res = []
for s in segments:
    m = int(s["timeline_start"] // 60)
    sec = int(s["timeline_start"] % 60)
    timestamps_res.append({
        "time": f"{m:02d}:{sec:02d}",
        "label": f"{s['badge_step']}. {s['badge_title']} — {s['badge_sub']}",
        "seconds": round(s["timeline_start"], 2)
    })

with open(TIMESTAMPS_OUTPUT, "w", encoding="utf-8") as f:
    json.dump(timestamps_res, f, indent=2, ensure_ascii=False)

print("\n=======================================================")
print("📋 ÍNDICE DE TIEMPOS (VIDEO DEMO MASTER SONORIZADO):")
print("=======================================================")
for item in timestamps_res:
    print(f"- **{item['time']}** : {item['label']}")
print("=======================================================\n")
