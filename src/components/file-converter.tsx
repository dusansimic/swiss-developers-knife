import { FileDown, FileUp } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { decodedFileName, saveFile } from '@/lib/file-io'

interface FileConverterProps {
  /** Short name of the encoding, e.g. "Base64". */
  label: string
  /** Extension added to encoded output (without dot), e.g. "b64". */
  encodedExt: string
  /** Encode raw bytes to the encoding's text form. */
  encodeBytes: (bytes: Uint8Array) => string
  /** Decode the encoding's text form back to raw bytes. Throws on bad input. */
  decodeBytes: (text: string) => Uint8Array
}

/**
 * File-based encode/decode: two buttons open a file picker; conversion runs as
 * soon as a file is chosen, then a Save dialog opens for the result.
 */
export function FileConverter({
  label,
  encodedExt,
  encodeBytes,
  decodeBytes,
}: FileConverterProps) {
  const encodeInputId = useId()
  const decodeInputId = useId()
  const encodeRef = useRef<HTMLInputElement>(null)
  const decodeRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'encode' | 'decode' | null>(null)

  async function handleEncode(file: File) {
    setBusy('encode')
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const text = encodeBytes(bytes)
      const saved = await saveFile(
        text,
        `${file.name}.${encodedExt}.txt`,
        'text/plain',
      )
      if (saved) toast.success(`Encoded ${file.name} to ${label}.`)
    } catch {
      toast.error(`Failed to encode ${file.name}.`)
    } finally {
      setBusy(null)
    }
  }

  async function handleDecode(file: File) {
    setBusy('decode')
    try {
      const text = await file.text()
      const bytes = decodeBytes(text)
      const saved = await saveFile(
        bytes,
        decodedFileName(file.name, encodedExt),
        'application/octet-stream',
      )
      if (saved) toast.success(`Decoded ${file.name} from ${label}.`)
    } catch {
      toast.error(`Invalid ${label} file — cannot decode ${file.name}.`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Files</h2>
      <p className="text-sm text-muted-foreground">
        Pick a file to convert. Encoding runs immediately, then a Save dialog
        opens for the result.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => encodeRef.current?.click()}
          disabled={busy !== null}
        >
          <FileUp className="mr-2 h-4 w-4" />
          {busy === 'encode' ? 'Encoding…' : 'Encode a file'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => decodeRef.current?.click()}
          disabled={busy !== null}
        >
          <FileDown className="mr-2 h-4 w-4" />
          {busy === 'decode' ? 'Decoding…' : 'Decode a file'}
        </Button>
      </div>

      <input
        id={encodeInputId}
        ref={encodeRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          // Reset so picking the same file again re-triggers onChange.
          e.target.value = ''
          if (file) void handleEncode(file)
        }}
      />
      <input
        id={decodeInputId}
        ref={decodeRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void handleDecode(file)
        }}
      />
    </div>
  )
}
