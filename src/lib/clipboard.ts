/**
 * Copia `text` al portapapeles. Devuelve true si se copió y false si el navegador lo impidió (nunca
 * lanza), para que quien llama avise al usuario en vez de dar por buena una copia fallida.
 *
 * `navigator.clipboard` solo existe en contextos seguros (HTTPS o localhost) y puede rechazar la
 * escritura (navegadores integrados de otras apps, documento sin foco...). En ese caso se recurre a la
 * vía clásica: un textarea temporal seleccionado y `document.execCommand("copy")`, que funciona dentro
 * de un gesto del usuario (un clic).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Se prueba la vía clásica.
  }
  return copyWithSelection(text);
}

function copyWithSelection(text: string): boolean {
  // El textarea roba el foco: se devuelve al elemento que lo tenía (el botón) para no desorientar a
  // quien navega con teclado.
  const previouslyFocused = document.activeElement;
  let area: HTMLTextAreaElement | undefined;
  try {
    area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    // Fuera de la vista y con 16px: iOS hace zoom al enfocar un campo con letra más pequeña.
    area.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0;font-size:16px;";
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area?.remove();
    if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus({ preventScroll: true });
  }
}
