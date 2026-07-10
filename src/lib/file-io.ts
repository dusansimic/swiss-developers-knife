/**
 * Small browser file-IO helpers: read a picked file and save a result.
 *
 * Saving prefers the File System Access API (`showSaveFilePicker`), which opens
 * a real "Save as" dialog. When it is unavailable (Firefox, Safari) it falls
 * back to a normal anchor download into the browser's download folder.
 */

interface FileSystemWritable {
  write: (data: Blob) => Promise<void>
  close: () => Promise<void>
}

interface FileSystemFileHandleLike {
  createWritable: () => Promise<FileSystemWritable>
}

type ShowSaveFilePicker = (options?: {
  suggestedName?: string
}) => Promise<FileSystemFileHandleLike>

/**
 * Save `data` to disk. Opens a Save dialog where supported; otherwise triggers
 * a download. Returns false if the user cancels the Save dialog.
 */
export async function saveFile(
  data: string | Uint8Array,
  suggestedName: string,
  mimeType: string,
): Promise<boolean> {
  // Copy bytes into a guaranteed ArrayBuffer-backed view so they satisfy
  // BlobPart (a typed array may be backed by a SharedArrayBuffer at the type
  // level).
  const part: BlobPart = typeof data === 'string' ? data : Uint8Array.from(data)
  const blob = new Blob([part], { type: mimeType })

  const picker = (
    window as unknown as { showSaveFilePicker?: ShowSaveFilePicker }
  ).showSaveFilePicker
  if (typeof picker === 'function') {
    try {
      const handle = await picker({ suggestedName })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return true
    } catch (err) {
      // User dismissed the dialog — not an error.
      if (err instanceof DOMException && err.name === 'AbortError') return false
      // Any other failure: fall through to the download fallback.
    }
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = suggestedName
  anchor.click()
  URL.revokeObjectURL(url)
  return true
}

/**
 * Derive a sensible output name for a decoded file by stripping the encoding
 * extensions we add on encode (e.g. `photo.png.b64.txt` -> `photo.png`).
 */
export function decodedFileName(name: string, encodedExt: string): string {
  const stripped = name
    .replace(new RegExp(`\\.${encodedExt}\\.txt$`, 'i'), '')
    .replace(new RegExp(`\\.${encodedExt}$`, 'i'), '')
    .replace(/\.txt$/i, '')
  return stripped === name ? `${name}.decoded` : stripped
}
