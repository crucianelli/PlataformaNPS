import pyautogui as pg
import time
import ctypes
import random
import subprocess
import win32api
import win32clipboard
import win32con
import win32gui
import win32process
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
        print("❌ No se encontró el archivo .env. Crealo con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.")
        sys.exit(1)
    with open(env_path, encoding='utf-8') as f:
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

# ─── Helpers de Supabase ────────────────────────────────────────────────────

def _request(path, data=None, method='GET', timeout=30):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            contenido = res.read()
            return json.loads(contenido) if contenido else None
    except HTTPError as e:
        if e.code == 401:
            print("❌ Supabase rechazó la llave (401). Revisá SUPABASE_SERVICE_ROLE_KEY en el .env.")
            sys.exit(1)
        detalle = e.read().decode(errors='replace')[:200]
        print(f"❌ Supabase respondió {e.code}: {detalle}")
        raise
    except URLError as e:
        print(f"❌ No se pudo contactar a Supabase ({SUPABASE_URL}): {e.reason}")
        raise

def supabase_get(path):
    return _request(path)

def supabase_patch(path, data):
    return _request(path, data=data, method='PATCH')

def rpc(funcion, argumentos, timeout=30):
    """Llama a una función SQL de la base (ver 20261023000000_whatsapp_ejecucion_unica.sql)."""
    return _request(f"rpc/{funcion}", data=argumentos, method='POST', timeout=timeout)

def reportar_contacto(job_id, detalle_id, estado, error=None):
    """
    Avisa cómo salió un contacto. Reintenta: si esto se pierde, el contacto
    queda como pendiente y en la próxima corrida le llega el mensaje de nuevo
    a alguien que ya lo recibió.
    """
    if estado == 'enviado':
        cambios, contador = {'estado': 'enviado', 'enviado_at': 'now()'}, 'enviados'
    else:
        cambios, contador = {'estado': 'error', 'error_mensaje': str(error)[:200]}, 'errores'

    for intento in range(3):
        try:
            supabase_patch(f"envios_whatsapp_detalle?id=eq.{detalle_id}", cambios)
            break
        except Exception as e:
            if intento == 2:
                print(f"⚠️  ATENCIÓN: no se pudo registrar el resultado de este contacto ({e}).")
                print(f"   El mensaje SÍ se mandó, pero la plataforma no se enteró: si relanzás")
                print(f"   el job, a esta persona le va a llegar dos veces. Detalle: {detalle_id}")
                return
            time.sleep(3)

    # El contador es solo para la barra de progreso: al soltar el job la base lo
    # recuenta desde las filas, así que si esto falla no queda mal.
    try:
        job = supabase_get(f"envios_whatsapp_jobs?id=eq.{job_id}&select={contador}")[0]
        supabase_patch(f"envios_whatsapp_jobs?id=eq.{job_id}", {contador: job[contador] + 1})
    except Exception:
        pass

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
        return rpc(
            f"whatsapp_{accion}_job",
            {'p_job_id': self.job_id, 'p_ejecucion_id': self.id},
            timeout=timeout,
        )

    def tomar(self):
        """'ok', 'ocupado' (otra ventana lo está mandando), 'sin_pendientes' o 'no_existe'."""
        resultado = self._llamar('tomar')
        self.tomada = resultado == 'ok'
        return resultado

    def senal(self, forzar=False):
        """Avisa que sigue viva. Si hay que parar, levanta Corte."""
        if not forzar and time.monotonic() - self._ultima_senal < INTERVALO_SENAL:
            return
        self._ultima_senal = time.monotonic()
        try:
            resultado = self._llamar('senal', timeout=10)
        except Exception:
            # Sin conexión no se corta: lo único que se pierde es enterarse de
            # un "Detener", y eso puede esperar a que vuelva internet.
            if not self._sin_conexion:
                print("⚠️  Sin conexión con Supabase. Sigo mandando; si la detenés desde la plataforma, me entero cuando vuelva.")
                self._sin_conexion = True
            return
        if self._sin_conexion:
            print("✅ Volvió la conexión con Supabase.")
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
                return self._llamar('soltar', timeout=timeout)
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

# ─── Ventana de WhatsApp ────────────────────────────────────────────────────
#
# Hasta oct-2026 el chat se abría como una pestaña más, el script hacía clic en
# un punto fijo de la pantalla (700, 500) y cerraba con Ctrl+W. Las tres cosas
# caían sobre la ventana que estuviera al frente: si Chrome no había pasado
# adelante (Windows a veces no lo deja) o si justo estabas usando otra cosa, el
# clic, el texto y el Ctrl+W iban a parar a otro programa. Y aunque Chrome
# estuviera al frente, ese punto queda en el medio del chat, donde puede haber
# un link o una foto de un mensaje anterior.
#
# Ahora cada chat se abre en su propia ventana de Chrome y el script:
#   - espera a que sueltes el mouse y el teclado antes de tomar la pantalla;
#   - no aprieta nada si esa ventana no quedó al frente, y frena si en el medio
#     pasás a otra;
#   - hace clic en la caja de texto (abajo de todo), no en el medio del chat;
#   - te devuelve el mouse a donde estaba y la ventana que estabas usando;
#   - cierra ESA ventana, sin Ctrl+W.

# Segundos sin tocar mouse ni teclado antes de tomar la pantalla.
PC_LIBRE = 2.0

class VentanaPerdida(Exception):
    """La ventana del chat dejó de estar al frente: no se aprieta nada más."""


def _ejecutable(hwnd):
    _, pid = win32process.GetWindowThreadProcessId(hwnd)
    kernel32 = ctypes.windll.kernel32
    proceso = kernel32.OpenProcess(0x1000, False, pid)  # PROCESS_QUERY_LIMITED_INFORMATION
    if not proceso:
        return ''
    try:
        largo = ctypes.c_ulong(1024)
        ruta = ctypes.create_unicode_buffer(largo.value)
        if kernel32.QueryFullProcessImageNameW(proceso, 0, ruta, ctypes.byref(largo)):
            return ruta.value
        return ''
    finally:
        kernel32.CloseHandle(proceso)


def ventanas_abiertas():
    ventanas = set()
    win32gui.EnumWindows(lambda hwnd, _: ventanas.add(hwnd) or True, None)
    return ventanas


def _es_el_chat(hwnd):
    # Spotify, VS Code, Docker Desktop y otras apps usan la misma clase de
    # ventana que Chrome: por eso se mira también el programa.
    try:
        return (
            win32gui.IsWindowVisible(hwnd)
            and win32gui.GetClassName(hwnd) == 'Chrome_WidgetWin_1'
            and 'whatsapp' in win32gui.GetWindowText(hwnd).lower()
            and os.path.basename(_ejecutable(hwnd)).lower() == os.path.basename(CHROME_PATH).lower()
        )
    except Exception:
        return False


def buscar_ventana_nueva(antes):
    """La ventana del chat que se abrió después de la foto `antes`, o None."""
    for hwnd in ventanas_abiertas() - antes:
        if _es_el_chat(hwnd):
            return hwnd
    return None


def al_frente(hwnd):
    return win32gui.GetForegroundWindow() == hwnd


def exigir_al_frente(hwnd):
    if not al_frente(hwnd):
        raise VentanaPerdida()


def traer_al_frente(hwnd):
    try:
        win32gui.ShowWindow(hwnd, win32con.SW_MAXIMIZE)
        # Que WhatsApp se acomode al tamaño nuevo antes de hacer clic.
        time.sleep(1.0)
    except Exception:
        pass
    for _ in range(4):
        if al_frente(hwnd):
            return True
        try:
            # Windows no deja que un programa pase una ventana al frente si no
            # es el que estás usando. Un Alt simulado lo destraba; solo se
            # manda si hace falta, porque en Chrome el Alt enfoca el menú.
            pg.press('alt')
            win32gui.SetForegroundWindow(hwnd)
        except Exception:
            pass
        time.sleep(0.4)
    return al_frente(hwnd)


def segundos_sin_usar_la_pc():
    return ((win32api.GetTickCount() - win32api.GetLastInputInfo()) & 0xFFFFFFFF) / 1000


def esperar_pc_libre(ejecucion):
    avisado = False
    while segundos_sin_usar_la_pc() < PC_LIBRE:
        if not avisado:
            print("   ✋ Estás usando la PC: espero a que sueltes el mouse y el teclado un par de segundos.")
            avisado = True
        ejecucion.esperar(0.5)


def devolver_mouse(posicion):
    x, y = posicion
    # Dejarlo justo en una esquina dispararía el freno de emergencia en la
    # próxima acción del script.
    if (x, y) in pg.FAILSAFE_POINTS:
        ancho, alto = pg.size()
        x = min(max(x, 5), ancho - 6)
        y = min(max(y, 5), alto - 6)
    try:
        win32api.SetCursorPos((x, y))
    except Exception:
        pass


def clic_en_caja_de_texto(hwnd):
    """
    Clic en la caja donde se escribe: abajo de todo, en el panel del chat.
    Ahí no hay mensajes, links ni fotos que se puedan abrir por error.
    """
    izquierda, arriba, derecha, abajo = win32gui.GetClientRect(hwnd)
    x0, _ = win32gui.ClientToScreen(hwnd, (izquierda, arriba))
    x1, y1 = win32gui.ClientToScreen(hwnd, (derecha, abajo))
    x = int(x0 + (x1 - x0) * 0.62)
    y = y1 - 30
    posicion = win32api.GetCursorPos()
    try:
        pg.click(x, y)
    finally:
        devolver_mouse(posicion)


def cerrar_ventana(hwnd):
    if not hwnd:
        return
    try:
        if win32gui.IsWindow(hwnd):
            win32gui.PostMessage(hwnd, win32con.WM_CLOSE, 0, 0)
    except Exception:
        return
    for _ in range(15):
        if not win32gui.IsWindow(hwnd):
            return
        time.sleep(0.2)


def devolver_foco(anterior, ventana):
    if not anterior or anterior == ventana:
        return
    try:
        if win32gui.IsWindow(anterior) and not al_frente(anterior):
            win32gui.SetForegroundWindow(anterior)
    except Exception:
        # Si Windows no lo deja, queda al frente la ventana que estaba atrás
        # del chat, que casi siempre es la misma.
        pass

# ─── Envío ──────────────────────────────────────────────────────────────────

def abrir_chat(ejecucion, contacto, espera_carga):
    """
    Abre el chat en una ventana nueva. Devuelve esa ventana (o None si no
    apareció) y la que estabas usando antes de que se abriera.
    """
    anterior = win32gui.GetForegroundWindow()
    antes = ventanas_abiertas()
    subprocess.Popen([
        CHROME_PATH, '--new-window',
        f"https://web.whatsapp.com/send?phone={contacto['celular']}",
    ])
    ventana = None
    try:
        ejecucion.esperar(espera_carga)
        # Normalmente ya está; si Chrome tardó en arrancar, un rato más.
        for _ in range(10):
            ventana = buscar_ventana_nueva(antes)
            if ventana:
                return ventana, anterior
            ejecucion.esperar(1)
        return None, anterior
    except Corte:
        # Todavía no se escribió nada: se cierra y no queda nada a medias. Es
        # la ventana de esta corrida, así que no hay riesgo de cerrarle algo a
        # otra.
        cerrar_ventana(ventana or buscar_ventana_nueva(antes))
        raise


def mandar_a(ejecucion, contacto, espera_carga, imagen):
    """'enviado', 'error' o 'salteado' (no se mandó y queda pendiente)."""
    nombre = contacto['nombre']

    ventana, anterior = abrir_chat(ejecucion, contacto, espera_carga)
    if not ventana:
        print(f"⚠️  No encontré la ventana de WhatsApp de {nombre}. No toqué nada; queda pendiente.")
        return 'salteado'

    try:
        esperar_pc_libre(ejecucion)
    except Corte:
        cerrar_ventana(ventana)
        raise

    # De acá hasta el Enter no se corta por un "Detener": dejaría un mensaje a
    # medio pegar en el chat del cliente. Son unos pocos segundos.
    # La ventana a la que volver: la que estás usando ahora, o la de antes de
    # abrir el chat si Chrome ya pasó al frente solo.
    actual = win32gui.GetForegroundWindow()
    if actual != ventana:
        anterior = actual
    resultado = 'salteado'
    error = None
    try:
        if not traer_al_frente(ventana):
            print(f"⚠️  Windows no dejó traer WhatsApp al frente. No toqué nada; {nombre} queda pendiente.")
        else:
            # El clic deja el foco en la caja de texto. Ctrl+A y borrar la
            # vacía, por si había un borrador de antes que se mezclaría.
            clic_en_caja_de_texto(ventana)
            time.sleep(random.uniform(0.5, 1.0))
            exigir_al_frente(ventana)
            pg.press('x')
            pg.hotkey('ctrl', 'a')
            pg.press('backspace')

            if imagen:
                exigir_al_frente(ventana)
                copiar_imagen(imagen)
                pg.hotkey('ctrl', 'v')
                # Se abre la vista previa de la imagen, con el foco en el epígrafe.
                time.sleep(random.uniform(3, 4))

            exigir_al_frente(ventana)
            copiar_texto(contacto['mensaje'])
            pg.hotkey('ctrl', 'v')
            time.sleep(random.uniform(1, 2))

            exigir_al_frente(ventana)
            pg.press('enter')
            resultado = 'enviado'
    except VentanaPerdida:
        # El mensaje puede haber quedado escrito sin mandar en ese chat; la
        # próxima vez se borra con el Ctrl+A de arriba.
        print(f"⚠️  Cambiaste de ventana mientras escribía el mensaje de {nombre}: no lo mandé, queda pendiente.")
    except pg.FailSafeException:
        # Mouse llevado a una esquina de la pantalla: freno de emergencia de
        # pyautogui. No es un error de este contacto, es "pará todo".
        cerrar_ventana(ventana)
        raise
    except Exception as e:
        print(f"❌ Error con {nombre}: {e}")
        resultado, error = 'error', e

    if resultado == 'error':
        reportar_contacto(ejecucion.job_id, contacto['id'], 'error', error=error)
    elif resultado == 'enviado':
        reportar_contacto(ejecucion.job_id, contacto['id'], 'enviado')
        print(f"✅ Enviado a {nombre}.")
        # Darle tiempo a que salga (con imagen, a que se suba) antes de cerrar
        # la ventana: cerrarla antes puede dejar el mensaje sin mandar.
        time.sleep(random.uniform(4, 6) if imagen else random.uniform(2, 3))

    cerrar_ventana(ventana)
    devolver_foco(anterior, ventana)
    return resultado

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

def traer_job(job_id):
    """La plantilla y solo los contactos que faltan, cada uno con su mensaje armado."""
    job = supabase_get(f"envios_whatsapp_jobs?id=eq.{job_id}&select=plantilla:plantillas_whatsapp(lineas,ruta_imagen)")[0]
    plantilla = job.get('plantilla') or {}
    lineas = plantilla.get('lineas') or []

    # Solo pendientes: relanzar un envío cortado no le vuelve a escribir a quien
    # ya lo recibió.
    detalles = supabase_get(
        f"envios_whatsapp_detalle?job_id=eq.{job_id}&estado=eq.pendiente&select=id,celular,nombre,url_encuesta&order=id"
    )
    contactos = [
        {
            'id': d['id'],
            'celular': d['celular'].strip(),
            'nombre': d['nombre'],
            'mensaje': '\n'.join(
                l.replace('{nombre}', d['nombre']).replace('{url}', d['url_encuesta']) for l in lineas
            ),
        }
        for d in detalles
    ]
    return {'ruta_imagen': plantilla.get('ruta_imagen'), 'contactos': contactos}

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
    print("   Por cada mensaje el script toma la pantalla unos segundos: en ese rato no toques nada.")
    print("   Después te devuelve el mouse y la ventana en la que estabas.")

    salteados = []

    for i, contacto in enumerate(contactos):
        if i > 0 and i % PAUSA_LARGA_CADA == 0:
            pausa = random.uniform(*PAUSA_LARGA)
            print(f"☕ Pausa de seguridad: {pausa:.0f}s...")
            ejecucion.esperar(pausa)

        # Último chequeo antes de abrir un chat nuevo.
        ejecucion.senal(forzar=True)

        espera = random.uniform(*(ESPERA_PRIMER_CHAT if i == 0 else ESPERA_CARGA_CHAT))
        print(f"⏳ [{i+1}/{total}] Abriendo el chat de {contacto['nombre']}...")
        if mandar_a(ejecucion, contacto, espera, imagen) == 'salteado':
            salteados.append(contacto)

        # Después del último no hay nada que separar.
        if i < total - 1:
            entre = random.uniform(*ESPERA_ENTRE_MENSAJES)
            print(f"💤 Siguiente en {entre:.0f}s...")
            ejecucion.esperar(entre)

    # Una vuelta más para los que no se mandaron (por ejemplo, porque pasaste a
    # otra ventana justo mientras escribía). Los que fallen de nuevo quedan
    # pendientes para Reanudar.
    if salteados:
        print(f"\n🔁 Vuelvo a intentar con {len(salteados)} que quedaron sin mandar...")
        for contacto in salteados:
            ejecucion.esperar(random.uniform(*ESPERA_ENTRE_MENSAJES))
            ejecucion.senal(forzar=True)
            print(f"⏳ Abriendo de nuevo el chat de {contacto['nombre']}...")
            mandar_a(ejecucion, contacto, random.uniform(*ESPERA_CARGA_CHAT), imagen)

# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    job_id = get_job_id()
    print(f"🚀 Iniciando job: {job_id}")

    if not os.path.exists(CHROME_PATH):
        print(f"❌ No encuentro Chrome en {CHROME_PATH}. Si está en otro lado, poné CHROME_PATH en el .env.")
        sys.exit(1)

    ejecucion = Ejecucion(job_id)
    resultado = ejecucion.tomar()

    if resultado == 'no_existe':
        print("❌ No se encontró el job.")
        sys.exit(1)
    if resultado == 'ocupado':
        print("⛔ Este envío ya lo está mandando otra ventana del script. Esta se cierra sin hacer nada.")
        print("   Si cerraste esa ventana hace menos de un minuto, esperá un poco y volvé a apretar Reanudar.")
        return
    if resultado == 'sin_pendientes':
        print("✅ No queda nadie pendiente en este envío.")
        return

    soltar_al_cerrar_la_ventana(ejecucion)

    # Lo que pase (terminó, lo detuvieron, error, Ctrl+C), el job se suelta. El
    # estado final lo decide la base mirando quién quedó pendiente.
    estado = None
    try:
        enviar(ejecucion, traer_job(job_id))
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
