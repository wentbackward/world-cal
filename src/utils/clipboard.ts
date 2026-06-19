/**
 * Copy text to the clipboard, with a fallback for browsers/contexts where the
 * async Clipboard API is unavailable.
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
  }
}

/**
 * Copy rich (HTML) content with a plain-text fallback, so rich editors get the
 * formatting (bold, links) and plain/spreadsheet targets get the tab-separated text.
 */
export async function copyRich(html: string, text: string): Promise<void> {
  try {
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
      return;
    }
    throw new Error('Rich clipboard unavailable');
  } catch {
    await copyToClipboard(text);
  }
}
