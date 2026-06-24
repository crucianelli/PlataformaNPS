export function renderizarMensaje(
  lineas: string[],
  nombre: string,
  url: string,
): string {
  return lineas
    .map((l) => l.replace(/\{nombre\}/g, nombre).replace(/\{url\}/g, url))
    .join('\n')
}
