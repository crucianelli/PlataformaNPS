import pyautogui as pg
import time
import random
import subprocess
import win32clipboard
from PIL import Image
import io
import os
import sys
import json
import urllib.request
import urllib.parse
from urllib.error import URLError

# ─── Cargar .env ────────────────────────────────────────────────────────────

def load_env():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if not os.path.exists(env_path):
        print("❌ No se encontró el archivo .env. Crealo con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.")
        sys.exit(1)
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, _, value = line.partition('=')
                os.environ[key.strip()] = value.strip()

load_env()

SUPABASE_URL = os.environ.get('SUPABASE_URL', '').rstrip('/')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el .env")
    sys.exit(1)

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
}

# ─── Helpers Supabase ───────────────────────────────────────────────────────

def supabase_get(path):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read())

def supabase_patch(path, data):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers=HEADERS, method='PATCH')
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read()) if res.read() else {}

# ─── Parsear job ID del argumento de URL ────────────────────────────────────

def get_job_id():
    # Puede venir como: whatsapp-sender://run?job=abc123  o directamente abc123
    if len(sys.argv) < 2:
        print("❌ Falta el argumento job. Uso: python mensajes.py --job JOB_ID")
        print("   O lanzado por el protocol handler: whatsapp-sender://run?job=JOB_ID")
        sys.exit(1)

    arg = sys.argv[1]

    if arg.startswith('whatsapp-sender://'):
        parsed = urllib.parse.urlparse(arg)
        params = urllib.parse.parse_qs(parsed.query)
        job_id = params.get('job', [None])[0]
    elif arg == '--job' and len(sys.argv) >= 3:
        job_id = sys.argv[2]
    else:
        job_id = arg

    if not job_id:
        print("❌ No se pudo extraer el job ID del argumento.")
        sys.exit(1)

    return job_id

# ─── Función para copiar imagen ─────────────────────────────────────────────

def enviar_imagen_al_portapapeles(path):
    if not path or not os.path.exists(path):
        return False
    try:
        image = Image.open(path)
        output = io.BytesIO()
        image.convert("RGB").save(output, "BMP")
        data = output.getvalue()[14:]
        output.close()
        win32clipboard.OpenClipboard()
        win32clipboard.EmptyClipboard()
        win32clipboard.SetClipboardData(win32clipboard.CF_DIB, data)
        win32clipboard.CloseClipboard()
        return True
    except Exception as e:
        print(f"❌ Error al copiar imagen: {e}")
        return False

# ─── Main ────────────────────────────────────────────────────────────────────

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

def main():
    job_id = get_job_id()
    print(f"🚀 Iniciando job: {job_id}")

    # Marcar job como en_progreso
    supabase_patch(
        f"envios_whatsapp_jobs?id=eq.{job_id}",
        {'estado': 'en_progreso', 'started_at': 'now()'}
    )

    # Obtener detalles pendientes del job
    detalles = supabase_get(
        f"envios_whatsapp_detalle?job_id=eq.{job_id}&estado=eq.pendiente&select=*&order=id"
    )

    if not detalles:
        print("✅ No hay contactos pendientes en este job.")
        supabase_patch(
            f"envios_whatsapp_jobs?id=eq.{job_id}",
            {'estado': 'completado', 'completed_at': 'now()'}
        )
        return

    # Obtener plantilla del job para saber la imagen
    jobs = supabase_get(
        f"envios_whatsapp_jobs?id=eq.{job_id}&select=*,plantilla:plantillas_whatsapp(*)"
    )
    if not jobs:
        print("❌ No se encontró el job.")
        sys.exit(1)

    job = jobs[0]
    plantilla = job.get('plantilla', {})
    ruta_imagen = plantilla.get('ruta_imagen') or ''
    lineas_template = plantilla.get('lineas', [])

    total = len(detalles)
    print(f"📋 Contactos pendientes: {total}")

    for i, detalle in enumerate(detalles):
        # Pausa larga cada 4 envíos
        if i > 0 and i % 4 == 0:
            espera_larga = random.randint(120, 240)
            print(f"☕ Pausa de seguridad: {espera_larga}s...")
            time.sleep(espera_larga)

        celular = detalle['celular'].strip()
        nombre  = detalle['nombre']
        url     = detalle['url_encuesta']

        # Renderizar mensaje
        lineas = [
            l.replace('{nombre}', nombre).replace('{url}', url)
            for l in lineas_template
        ]

        # 1. Abrir chat
        chat_url = f"https://web.whatsapp.com/send?phone={celular}"
        subprocess.Popen([chrome_path, chat_url])

        espera_inicial = random.randint(25, 35)
        print(f"⏳ [{i+1}/{total}] Cargando chat de {nombre}...")
        time.sleep(espera_inicial)

        # 2. Click en el chat
        pg.moveTo(700 + random.randint(-50, 50), 500 + random.randint(-50, 50), duration=random.uniform(0.8, 1.5))
        pg.click()
        time.sleep(random.uniform(1, 2))

        # 3. Pegar imagen si hay
        tiene_imagen = enviar_imagen_al_portapapeles(ruta_imagen)
        if tiene_imagen:
            pg.hotkey('ctrl', 'v')
            time.sleep(random.uniform(4, 6))

        # 4. Escribir línea por línea
        print(f"✍️ Escribiendo mensaje para {nombre}...")
        try:
            for linea in lineas:
                pg.write(linea, interval=random.uniform(0.02, 0.08))
                pg.hotkey('shift', 'enter')
                time.sleep(random.uniform(0.3, 0.7))

            # Pausa final antes de enviar
            time.sleep(random.uniform(2, 4))
            pg.press('enter')

            # Marcar como enviado
            supabase_patch(
                f"envios_whatsapp_detalle?id=eq.{detalle['id']}",
                {'estado': 'enviado', 'enviado_at': 'now()'}
            )
            # Incrementar contador del job
            job_actual = supabase_get(f"envios_whatsapp_jobs?id=eq.{job_id}&select=enviados")[0]
            supabase_patch(
                f"envios_whatsapp_jobs?id=eq.{job_id}",
                {'enviados': job_actual['enviados'] + 1}
            )
            print(f"✅ Enviado.")

        except Exception as e:
            print(f"❌ Error con {nombre}: {e}")
            supabase_patch(
                f"envios_whatsapp_detalle?id=eq.{detalle['id']}",
                {'estado': 'error', 'error_mensaje': str(e)[:200]}
            )
            job_actual = supabase_get(f"envios_whatsapp_jobs?id=eq.{job_id}&select=errores")[0]
            supabase_patch(
                f"envios_whatsapp_jobs?id=eq.{job_id}",
                {'errores': job_actual['errores'] + 1}
            )

        # 5. Cerrar pestaña y esperar
        time.sleep(random.uniform(3, 5))
        pg.hotkey('ctrl', 'w')
        espera_entre = random.randint(30, 60)
        print(f"💤 Siguiente en {espera_entre}s...")
        time.sleep(espera_entre)

    # Marcar job como completado
    supabase_patch(
        f"envios_whatsapp_jobs?id=eq.{job_id}",
        {'estado': 'completado', 'completed_at': 'now()'}
    )
    print("\n🎉 Campaña finalizada con éxito.")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️ Script interrumpido manualmente.")
        # Intentar marcar como interrumpido
        try:
            job_id = get_job_id()
            supabase_patch(
                f"envios_whatsapp_jobs?id=eq.{job_id}",
                {'estado': 'interrumpido'}
            )
        except Exception:
            pass
