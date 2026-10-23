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
import uuid
import urllib.request
import urllib.parse
from urllib.error import HTTPError, URLError

# Que los print salgan bien también cuando el launcher manda la salida a un
# archivo: ahí Windows no usa UTF-8 y el primer emoji revienta el script. Y que
# se escriban al momento, no recién al terminar.
for _flujo in (sys.stdout, sys.stderr):
    try:
        _flujo.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)
    except Exception:
        pass

# ─── Cargar .env ────────────────────────────────────────────────────────────

def load_env():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if not os.path.exists(env_path):
        print("❌ No se encontró el archivo .env. Crealo con PLATAFORMA_URL y WHATSAPP_AGENTE_TOKEN.")
        sys.exit(1)
    with open(env_path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, _, value = line.partition('=')
                os.environ[key.strip()] = value.strip()

load_env()

PLATAFORMA_URL = os.environ.get('PLATAFORMA_URL', '').rstrip('/')
AGENTE_TOKEN   = os.environ.get('WHATSAPP_AGENTE_TOKEN', '')

if not PLATAFORMA_URL or not AGENTE_TOKEN:
    print("❌ Faltan PLATAFORMA_URL o WHATSAPP_AGENTE_TOKEN en el .env")
    sys.exit(1)

HEADERS = {
    'Authorization': f'Bearer {AGENTE_TOKEN}',
    'Content-Type': 'application/json',
}

# ─── Ritmo de envío ─────────────────────────────────────────────────────────
#
# Todo en segundos, como rango "mínimo-máximo": cada espera sale al azar dentro
# del rango, para que no haya dos iguales. Se puede cambiar desde el .env sin
# tocar el código, por ejemplo ESPERA_ENTRE_MENSAJES=20-40.
#
# Hasta oct-2026 el ritmo era mucho más lento (chat 25-35s, tipeo letra por
# letra, 30-60s entre mensajes y una pausa de 2-4 min cada 4): 32 mensajes
# llevaban una hora y media. Para volver a ese ritmo, en el .env:
#
#   ESPERA_CARGA_CHAT=25-35
#   ESPERA_ENTRE_MENSAJES=30-60
#   PAUSA_LARGA=120-240
#   PAUSA_LARGA_CADA=4
#
# Lo que evita parecer un robot es la separación entre un mensaje y el
# siguiente, y que no sea siempre la misma. Con los valores de abajo queda en
# unos 40 segundos (carga del chat + espera), más una pausa larga cada 10.

def _rango(nombre, defecto):
    crudo = os.environ.get(nombre, '').strip()
    if not crudo:
        return defecto
    try:
        minimo, maximo = (float(x) for x in crudo.split('-'))
    except ValueError:
        print(f"⚠️  {nombre}={crudo} no se entiende (tiene que ser algo como 10-20). Uso {defecto[0]:g}-{defecto[1]:g}.")
        return defecto
    return (min(minimo, maximo), max(minimo, maximo))

def _entero(nombre, defecto):
    crudo = os.environ.get(nombre, '').strip()
    if not crudo:
        return defecto
    try:
        return max(1, int(crudo))
    except ValueError:
        print(f"⚠️  {nombre}={crudo} no es un número entero. Uso {defecto}.")
        return defecto

# El primer chat tarda más: puede que Chrome ni esté abierto.
ESPERA_PRIMER_CHAT    = _rango('ESPERA_PRIMER_CHAT', (30, 40))
# Lo que se le da a WhatsApp Web para cargar el chat antes de pegar. Si en esta
# PC los chats tardan más en abrir, subir esto: pegar antes de que cargue hace
# que el mensaje no salga.
ESPERA_CARGA_CHAT     = _rango('ESPERA_CARGA_CHAT', (15, 20))
ESPERA_ENTRE_MENSAJES = _rango('ESPERA_ENTRE_MENSAJES', (8, 16))
PAUSA_LARGA           = _rango('PAUSA_LARGA', (60, 120))
PAUSA_LARGA_CADA      = _entero('PAUSA_LARGA_CADA', 10)

# Cada cuánto el script avisa que sigue vivo y se fija si lo detuvieron.
INTERVALO_SENAL = 5

CHROME_PATH = os.environ.get('CHROME_PATH') or r'C:\Program Files\Google\Chrome\Application\chrome.exe'

# ─── Helpers de la plataforma ───────────────────────────────────────────────
#
# Antes esto hablaba directo con Supabase usando la service_role_key, que es una
# llave con acceso total a la base. Ahora va contra la plataforma, con un token
# que solo abre los endpoints de /api/whatsapp/agente.

def _request(path, data=None, method='GET', timeout=30):
    url = f"{PLATAFORMA_URL}/api/whatsapp/agente/{path}"
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            contenido = res.read()
            return json.loads(contenido) if contenido else {}
    except HTTPError as e:
        if e.code == 401:
            print("❌ La plataforma rechazó el token (401). Revisá WHATSAPP_AGENTE_TOKEN en el .env,")
            print("   tiene que ser el mismo que está configurado en el servidor.")
            sys.exit(1)
        if e.code == 404:
            raise
        detalle = e.read().decode(errors='replace')[:200]
        print(f"❌ La plataforma respondió {e.code}: {detalle}")
        raise
    except URLError as e:
        print(f"❌ No se pudo contactar a la plataforma ({PLATAFORMA_URL}): {e.reason}")
        raise

def api_get(path):
    return _request(path)

def api_post(path, data, timeout=30):
    return _request(path, data=data, method='POST', timeout=timeout)

def reportar_contacto(detalle_id, estado, error=None):
    """
    Avisa cómo salió un contacto. Reintenta: si esto se pierde, el contacto
    queda como pendiente y en la próxima corrida le llega el mensaje de nuevo
    a alguien que ya lo recibió.
    """
    payload = {'estado': estado}
    if error:
        payload['error'] = str(error)[:200]

    for intento in range(3):
        try:
            return api_post(f"contactos/{detalle_id}", payload)
        except Exception as e:
            if intento == 2:
                print(f"⚠️  ATENCIÓN: no se pudo registrar el resultado de este contacto ({e}).")
                print(f"   El mensaje SÍ se mandó, pero la plataforma no se enteró: si relanzás")
                print(f"   el job, a esta persona le va a llegar dos veces. Detalle: {detalle_id}")
                return None
            time.sleep(3)

# ─── Una corrida del script sobre un job ────────────────────────────────────
#
# El job tiene dueño: esta corrida lo toma al arrancar, avisa cada pocos
# segundos que sigue viva, y lo suelta al salir. Mientras esté viva nadie más
# puede tomarlo, así que apretar "Reanudar" con esta ventana todavía abierta no
# arranca un segundo script en paralelo (que era lo que pasaba antes: dos
# scripts manejando el mismo mouse).
#
# La señal de vida es también cómo se entera de un "Detener": se manda durante
# todas las esperas, así que el script para en segundos y no al terminar el
# contacto en curso.

class Corte(Exception):
    """Hay que parar: lo detuvieron ('detenido') u otra ventana tomó el job ('reemplazado')."""
    def __init__(self, motivo):
        super().__init__(motivo)
        self.motivo = motivo


class Ejecucion:
    def __init__(self, job_id):
        self.job_id = job_id
        self.id = str(uuid.uuid4())
        self.tomada = False
        self._ultima_senal = 0.0
        self._sin_conexion = False

    def _llamar(self, accion, timeout=30):
        return api_post(
            f"jobs/{self.job_id}/ejecucion",
            {'accion': accion, 'ejecucion_id': self.id},
            timeout=timeout,
        )

    def tomar(self):
        """'ok', 'ocupado' (otra ventana lo está mandando) o 'sin_pendientes'."""
        resultado = self._llamar('tomar')['resultado']
        self.tomada = resultado == 'ok'
        return resultado

    def senal(self, forzar=False):
        """Avisa que sigue viva. Si hay que parar, levanta Corte."""
        if not forzar and time.monotonic() - self._ultima_senal < INTERVALO_SENAL:
            return
        self._ultima_senal = time.monotonic()
        try:
            resultado = self._llamar('senal', timeout=10)['resultado']
        except Exception:
            # Sin conexión no se corta: lo único que se pierde es enterarse de
            # un "Detener", y eso puede esperar a que vuelva internet.
            if not self._sin_conexion:
                print("⚠️  Sin conexión con la plataforma. Sigo mandando; si la detenés desde ahí, me entero cuando vuelva.")
                self._sin_conexion = True
            return
        if self._sin_conexion:
            print("✅ Volvió la conexión con la plataforma.")
            self._sin_conexion = False
        if resultado != 'seguir':
            if resultado == 'reemplazado':
                # El job ya es de otra ventana: no hay nada que soltar.
                self.tomada = False
            raise Corte(resultado)

    def esperar(self, segundos):
        """Como time.sleep, pero dando señales de vida y cortando si lo detienen."""
        fin = time.monotonic() + segundos
        while True:
            self.senal()
            resto = fin - time.monotonic()
            if resto <= 0:
                return
            time.sleep(min(1.0, resto))

    def soltar(self, timeout=15, intentos=3):
        """Devuelve el job y el estado en que quedó ('completado' o 'interrumpido')."""
        if not self.tomada:
            return None
        self.tomada = False
        for intento in range(intentos):
            try:
                return self._llamar('soltar', timeout=timeout).get('estado')
            except Exception:
                if intento < intentos - 1:
                    time.sleep(2)
        # Si no se pudo avisar, en un minuto sin señales la plataforma lo da por
        # cortado y se puede reanudar igual.
        return None


def soltar_al_cerrar_la_ventana(ejecucion):
    """
    Si cierran la ventana con la X, Windows le da al proceso unos segundos antes
    de matarlo. Se aprovechan para soltar el job: así la plataforma lo muestra
    detenido enseguida, en vez de esperar un minuto sin señales.
    """
    try:
        import win32api
    except ImportError:
        return

    # CTRL_CLOSE_EVENT, CTRL_LOGOFF_EVENT, CTRL_SHUTDOWN_EVENT
    CIERRE = (2, 5, 6)

    def al_cerrar(tipo):
        if tipo in CIERRE:
            ejecucion.soltar(timeout=3, intentos=1)
            return True
        # Ctrl+C sigue su camino normal (KeyboardInterrupt).
        return False

    try:
        win32api.SetConsoleCtrlHandler(al_cerrar, True)
    except Exception:
        # Sin esto el envío anda igual: el job se libera solo al minuto.
        pass

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

# ─── Portapapeles ───────────────────────────────────────────────────────────
#
# El mensaje se PEGA, no se tipea. Tipearlo letra por letra con pyautogui
# llevaba ~25 segundos por mensaje y además se comía en silencio todo lo que no
# fuera ASCII: los emojis, la "¡", las tildes y la "ñ" no llegaban ("Se cumplió
# un año" salía "Se cumpli un ao").

def _con_portapapeles(escribir):
    # Otro programa puede tener el portapapeles abierto un instante.
    for intento in range(10):
        try:
            win32clipboard.OpenClipboard()
        except Exception:
            time.sleep(0.2)
            continue
        try:
            win32clipboard.EmptyClipboard()
            escribir()
            return
        finally:
            win32clipboard.CloseClipboard()
    raise RuntimeError("no se pudo abrir el portapapeles de Windows")

def copiar_texto(texto):
    texto = texto.replace('\r\n', '\n').replace('\n', '\r\n')
    _con_portapapeles(lambda: win32clipboard.SetClipboardText(texto, win32clipboard.CF_UNICODETEXT))

def copiar_imagen(dib):
    _con_portapapeles(lambda: win32clipboard.SetClipboardData(win32clipboard.CF_DIB, dib))

def cargar_imagen(ruta):
    """La imagen de la plantilla en el formato del portapapeles, una sola vez para todo el envío."""
    image = Image.open(ruta)
    output = io.BytesIO()
    image.convert("RGB").save(output, "BMP")
    data = output.getvalue()[14:]
    output.close()
    return data

# ─── Envío ──────────────────────────────────────────────────────────────────

def cerrar_pestana():
    pg.hotkey('ctrl', 'w')

def mandar_a(ejecucion, contacto, espera_carga, imagen):
    nombre = contacto['nombre']

    subprocess.Popen([CHROME_PATH, f"https://web.whatsapp.com/send?phone={contacto['celular']}"])
    try:
        ejecucion.esperar(espera_carga)
    except Corte as corte:
        # El chat está abierto pero todavía no se escribió nada: se cierra la
        # pestaña y no queda nada a medias. Si otra ventana tomó el job no se
        # toca nada: el Ctrl+W podría cerrarle la pestaña a ella.
        if corte.motivo == 'detenido':
            cerrar_pestana()
        raise

    # De acá hasta el Enter no se corta: un "Detener" en el medio dejaría un
    # mensaje a medio pegar en el chat del cliente. Son unos pocos segundos.
    try:
        # Click en el chat, para que la ventana de Chrome tenga el foco.
        pg.moveTo(700 + random.randint(-50, 50), 500 + random.randint(-50, 50), duration=random.uniform(0.5, 1.0))
        pg.click()
        time.sleep(random.uniform(0.8, 1.5))

        # WhatsApp manda a la caja de texto cualquier tecla que se apriete con el
        # chat abierto: la "x" la enfoca. Ctrl+A y borrar la deja vacía, por si
        # había un borrador de antes que se mezclaría con el mensaje.
        pg.press('x')
        pg.hotkey('ctrl', 'a')
        pg.press('backspace')

        if imagen:
            copiar_imagen(imagen)
            pg.hotkey('ctrl', 'v')
            # Se abre la vista previa de la imagen, con el foco en el epígrafe.
            time.sleep(random.uniform(3, 4))

        copiar_texto(contacto['mensaje'])
        pg.hotkey('ctrl', 'v')
        time.sleep(random.uniform(1, 2))
        pg.press('enter')
    except pg.FailSafeException:
        # Mouse llevado a una esquina de la pantalla: freno de emergencia de
        # pyautogui. No es un error de este contacto, es "pará todo".
        raise
    except Exception as e:
        print(f"❌ Error con {nombre}: {e}")
        reportar_contacto(contacto['id'], 'error', error=e)
    else:
        reportar_contacto(contacto['id'], 'enviado')
        print(f"✅ Enviado a {nombre}.")

    # Darle tiempo a que salga (con imagen, a que se suba) antes de cerrar la
    # pestaña: cerrarla antes puede dejar el mensaje sin mandar.
    time.sleep(random.uniform(4, 6) if imagen else random.uniform(2, 3))
    cerrar_pestana()

def _promedio(rango):
    return (rango[0] + rango[1]) / 2

def minutos_estimados(total, con_imagen):
    mecanica = 1 + 1.2 + 1.5 + (3.5 + 5 if con_imagen else 2.5)
    segundos = (
        _promedio(ESPERA_PRIMER_CHAT)
        + (total - 1) * _promedio(ESPERA_CARGA_CHAT)
        + total * mecanica
        + (total - 1) * _promedio(ESPERA_ENTRE_MENSAJES)
        + ((total - 1) // PAUSA_LARGA_CADA) * _promedio(PAUSA_LARGA)
    )
    return max(1, round(segundos / 60))

def enviar(ejecucion, job):
    contactos = job['contactos']
    total = len(contactos)

    ruta_imagen = job.get('ruta_imagen') or ''
    imagen = None
    if ruta_imagen:
        if not os.path.exists(ruta_imagen):
            # Antes se mandaba sin imagen sin avisar. La plantilla la nombra
            # ("llevate este MERCH..."), así que mejor no mandar nada.
            print(f"❌ La plantilla lleva la imagen '{ruta_imagen}', pero no está en {os.getcwd()}.")
            print("   Copiala a esta carpeta (o sacásela a la plantilla) y volvé a ejecutar.")
            return
        imagen = cargar_imagen(ruta_imagen)

    print(f"📋 Contactos pendientes: {total} — tiempo estimado: ~{minutos_estimados(total, bool(imagen))} min")
    print("   Para frenar: botón Detener en la plataforma, o cerrar esta ventana.")

    for i, contacto in enumerate(contactos):
        if i > 0 and i % PAUSA_LARGA_CADA == 0:
            pausa = random.uniform(*PAUSA_LARGA)
            print(f"☕ Pausa de seguridad: {pausa:.0f}s...")
            ejecucion.esperar(pausa)

        # Último chequeo antes de abrir un chat nuevo.
        ejecucion.senal(forzar=True)

        espera = random.uniform(*(ESPERA_PRIMER_CHAT if i == 0 else ESPERA_CARGA_CHAT))
        print(f"⏳ [{i+1}/{total}] Abriendo el chat de {contacto['nombre']}...")
        mandar_a(ejecucion, contacto, espera, imagen)

        # Después del último no hay nada que separar.
        if i < total - 1:
            entre = random.uniform(*ESPERA_ENTRE_MENSAJES)
            print(f"💤 Siguiente en {entre:.0f}s...")
            ejecucion.esperar(entre)

# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    job_id = get_job_id()
    print(f"🚀 Iniciando job: {job_id}")

    if not os.path.exists(CHROME_PATH):
        print(f"❌ No encuentro Chrome en {CHROME_PATH}. Si está en otro lado, poné CHROME_PATH en el .env.")
        sys.exit(1)

    ejecucion = Ejecucion(job_id)
    try:
        resultado = ejecucion.tomar()
    except HTTPError as e:
        if e.code == 404:
            print("❌ No se encontró el job.")
            sys.exit(1)
        raise

    if resultado == 'ocupado':
        print("⛔ Este envío ya lo está mandando otra ventana del script. Esta se cierra sin hacer nada.")
        print("   Si cerraste esa ventana hace menos de un minuto, esperá un poco y volvé a apretar Reanudar.")
        return
    if resultado == 'sin_pendientes':
        print("✅ No queda nadie pendiente en este envío.")
        return

    soltar_al_cerrar_la_ventana(ejecucion)

    # Lo que pase (terminó, lo detuvieron, error, Ctrl+C), el job se suelta. El
    # estado final lo decide la plataforma mirando quién quedó pendiente.
    estado = None
    try:
        # Trae solo los contactos que faltan, con el mensaje ya armado: relanzar
        # un envío cortado no le vuelve a escribir a quien ya lo recibió.
        job = api_get(f"jobs/{job_id}")
        enviar(ejecucion, job)
    except Corte as corte:
        if corte.motivo == 'reemplazado':
            print("\n⏹ Otra ventana del script tomó este envío. Esta se cierra sin tocar nada más.")
        else:
            print("\n⏹ Envío detenido desde la plataforma.")
    finally:
        estado = ejecucion.soltar()

    if estado == 'completado':
        print("\n🎉 Campaña finalizada con éxito.")
    elif estado == 'interrumpido':
        print("\n⏹ Quedaron contactos sin enviar. Podés reanudar desde la plataforma cuando quieras:")
        print("   solo se le manda a quien falta.")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️ Script interrumpido manualmente. El envío quedó detenido; podés reanudarlo desde la plataforma.")
    except pg.FailSafeException:
        print("\n⚠️ Freno de emergencia (mouse en una esquina). El envío quedó detenido; podés reanudarlo desde la plataforma.")
