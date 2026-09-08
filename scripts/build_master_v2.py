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
WORK_DIR = "demo_recordings/master_v2"

os.makedirs(f"{WORK_DIR}/audio", exist_ok=True)
os.makedirs(f"{WORK_DIR}/badges", exist_ok=True)

# Guiones cuidadosamente redactados para cobertura continua y profesional
segments_config = [
    {
        "id": 1,
        "start": 0.0,
        "end": 22.0,
        "voice_text": "Bienvenido a Cotizador Orbynex Digital, la plataforma comercial en la nube creada para agilizar tus propuestas y multiplicar el cierre de ventas de tu empresa con velocidad e inteligencia.",
        "badge_step": "01",
        "badge_title": "COTIZADOR ORBYNEX DIGITAL",
        "badge_sub": "PLATAFORMA COMERCIAL SAAS",
        "buffer_after": 1.0
    },
    {
        "id": 2,
        "start": 22.0,
        "end": 54.0,
        "voice_text": "El proceso de registro es inmediato y seguro. Ingresamos directamente a la pestaña Crear Cuenta, completamos los datos principales y utilizamos el selector de visibilidad para verificar nuestra contraseña antes de acceder al panel.",
        "badge_step": "02",
        "badge_title": "REGISTRO DE CUENTA EN VIVO",
        "badge_sub": "ACCESO INSTANTÁNEO AL PANEL",
        "buffer_after": 1.2
    },
    {
        "id": 3,
        "start": 54.0,
        "end": 129.0,
        "voice_text": "En el módulo Mi Negocio configuramos la identidad visual de la empresa. Subimos el logotipo corporativo que encabezará cada cotización y completamos la información tributaria, datos de contacto, condiciones comerciales y cuentas bancarias para agilizar las transferencias.",
        "badge_step": "03",
        "badge_title": "SUBIDA DE LOGO CORPORATIVO",
        "badge_sub": "MI NEGOCIO & DATOS DE FACTURACIÓN",
        "buffer_after": 1.2
    },
    {
        "id": 4,
        "start": 129.0,
        "end": 173.0,
        "voice_text": "En la sección de Clientes centralizamos nuestra cartera comercial. Registramos a Inversiones del Maule con su RUT, giro y datos de contacto, dejándolo disponible para cotizar en cualquier momento.",
        "badge_step": "04",
        "badge_title": "CARTERA DE CLIENTES",
        "badge_sub": "REGISTRO CENTRALIZADO",
        "buffer_after": 1.2
    },
    {
        "id": 5,
        "start": 173.0,
        "end": 215.0,
        "voice_text": "Al iniciar una nueva cotización encontramos el gran diferencial de Orbynex: su asistente de redacción con inteligencia artificial. Solo escribes un concepto ambiguo como 'página web' y con un clic el sistema lo convierte en una propuesta ejecutiva completa, con arquitectura, alcance técnico y especificaciones profesionales.",
        "badge_step": "05",
        "badge_title": "ASISTENTE IA: 'PÁGINA WEB'",
        "badge_sub": "TRANSFORMACIÓN A PROPUESTA TÉCNICA",
        "buffer_after": 1.5
    },
    {
        "id": 6,
        "start": 215.0,
        "end": 253.0,
        "voice_text": "Esta capacidad se adapta a cualquier industria o producto. Escribimos 'tarjetas de presentación', presionamos el asistente y obtenemos especificaciones técnicas de imprenta, detallando papel couché de 350 gramos, termolaminado y procesos de producción, calculando automáticamente subtotales e impuestos.",
        "badge_step": "06",
        "badge_title": "ASISTENTE IA: 'TARJETAS DE PRESENTACIÓN'",
        "badge_sub": "FICHA DE IMPRENTA Y PRODUCCIÓN",
        "buffer_after": 1.5
    },
    {
        "id": 7,
        "start": 253.0,
        "end": 280.53,
        "voice_text": "Finalmente, revisamos el documento en vivo: un PDF de calidad ejecutiva que incorpora el logotipo corporativo, partidas estructuradas por IA y desglose tributario con IVA. Emitimos la cotización oficial y descargamos el archivo final listo para enviar y cerrar la venta con tu cliente.",
        "badge_step": "07",
        "badge_title": "VISTA PREVIA PDF & EMISIÓN",
        "badge_sub": "DOCUMENTO OFICIAL CON LOGO E IVA",
        "buffer_after": 2.5
    }
]

print("🎙️ Paso 1: Generando clips de voz en español chileno (es-CL-LorenzoNeural)...")
voice = "es-CL-LorenzoNeural"

for s in segments_config:
    voice_file = f"{WORK_DIR}/audio/voice_{s['id']}.mp3"
    s["voice_file"] = voice_file
    cmd = ["edge-tts", "--voice", voice, "--text", s["voice_text"], "--write-media", voice_file]
    subprocess.run(cmd, check=True)
    
    probe_cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", voice_file]
    v_dur = float(subprocess.check_output(probe_cmd).decode("utf-8").strip())
    s["voice_dur"] = v_dur
    
    # Duración dinámica del segmento: voz + buffer mínimo para evitar silencios
    raw_dur = s["end"] - s["start"]
    accel_dur = v_dur + s["buffer_after"]
    speed = raw_dur / accel_dur
    s["accel_dur"] = accel_dur
    s["speed"] = speed
    print(f"Clip {s['id']}: Voz {v_dur:.2f}s | Video {accel_dur:.2f}s (Aceleración calculada: {speed:.2f}x)")

print("\n🎨 Paso 2: Renderizando Badges gráficos transparentes...")
badges_data = [
    {
        "id": s["id"],
        "step": s["badge_step"],
        "title": s["badge_title"],
        "subtitle": s["badge_sub"]
    }
    for s in segments_config
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

print("\n🎬 Paso 3: Acelerando segmentos de video con sincronización perfecta...")
timeline_cursor = 0.0
seg_files = []
for s in segments_config:
    accel_dur = s["accel_dur"]
    s["timeline_start"] = timeline_cursor
    s["timeline_end"] = timeline_cursor + accel_dur
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
        "-filter:v", f"setpts={pts_factor:.6f}*PTS,fps=30",
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-an",
        seg_file
    ]
    subprocess.run(cmd, check=True)
    print(f"Segmento {s['id']}: [{s['timeline_start']:.2f}s - {s['timeline_end']:.2f}s] ({accel_dur:.2f}s a {s['speed']:.2f}x)")

total_duration = timeline_cursor
mins = int(total_duration // 60)
secs = int(total_duration % 60)
print(f"⏱️ Duración final calculada: {total_duration:.2f}s (~{mins}m {secs:02d}s)")

concat_list = f"{WORK_DIR}/concat.txt"
with open(concat_list, "w") as f:
    for sf in seg_files:
        f.write(f"file '{os.path.abspath(sf)}'\n")

concat_video = f"{WORK_DIR}/video_concat.mp4"
subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_list, "-c", "copy", concat_video], check=True)

print("\n🎨 Paso 4: Superponiendo badges en esquina superior derecha...")
filter_parts = []
current_stream = "0:v"
for idx, s in enumerate(segments_config):
    badge_idx = idx + 1
    next_stream = f"v{idx+1}"
    t_in = s["timeline_start"] + 0.2
    t_out = s["timeline_end"] - 0.2
    filter_parts.append(
        f"[{current_stream}][{badge_idx}:v]overlay=x=1450:y=35:enable='between(t,{t_in:.2f},{t_out:.2f})'[{next_stream}]"
    )
    current_stream = next_stream

badge_inputs = []
for s in segments_config:
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

print("\n🎙️ Paso 5: Mezclando locución continua con música de fondo...")
voice_inputs = []
delay_filters = []
for idx, s in enumerate(segments_config):
    voice_inputs.extend(["-i", s["voice_file"]])
    # Inicio de voz apenas 0.3s después del inicio del bloque para fluidez total
    delay_ms = int((s["timeline_start"] + 0.3) * 1000)
    delay_filters.append(f"[{idx}:a]adelay={delay_ms}|{delay_ms}[v{idx}]")

amix_inputs = "".join([f"[v{i}]" for i in range(len(segments_config))])
voice_filter = ";".join(delay_filters) + f";{amix_inputs}amix=inputs={len(segments_config)}:dropout_transition=0,volume=2.2[vm]"

voice_master = f"{WORK_DIR}/voice_master.wav"
subprocess.run(["ffmpeg", "-y", *voice_inputs, "-filter_complex", voice_filter, "-map", "[vm]", voice_master], check=True)

audio_master = f"{WORK_DIR}/soundtrack.mp3"
fade_out_start = max(0, total_duration - 3.5)
cmd_mix = [
    "ffmpeg", "-y",
    "-i", voice_master,
    "-stream_loop", "-1", "-i", BG_MUSIC,
    "-filter_complex",
    f"[0:a]apad=pad_dur=20,volume=1.0[v];[1:a]volume=0.15,afade=t=out:st={fade_out_start:.2f}:d=3.3[m];[v][m]amix=inputs=2:duration=first:dropout_transition=2[aout]",
    "-map", "[aout]",
    "-t", f"{total_duration:.2f}",
    audio_master
]
subprocess.run(cmd_mix, check=True)

print("\n🚀 Paso 6: Renderizando video final sincronizado...")
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
for s in segments_config:
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
print("📋 ÍNDICE DE TIEMPOS (VIDEO MASTER V2 SONORIZADO):")
print("=======================================================")
for item in timestamps_res:
    print(f"- **{item['time']}** : {item['label']}")
print("=======================================================\n")
