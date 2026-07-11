import { Download } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveFile } from '@/lib/file-io'
import { buildVcard, vcardFilename } from '@/lib/vcard'

export function VcardTool() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const vcard = useMemo(
    () => buildVcard({ name, phone, email }),
    [name, phone, email],
  )

  async function download() {
    if (!vcard) return
    const saved = await saveFile(vcard, vcardFilename(name), 'text/vcard')
    if (saved) toast.success('vCard downloaded')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">vCard Generator</h1>
        <p className="text-muted-foreground">
          Enter a contact and download a <code>.vcf</code> file or scan the QR
          code to add it. Name is required; phone and email are optional.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vcard-name">Name</Label>
            <Input
              id="vcard-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vcard-phone">Phone (optional)</Label>
            <Input
              id="vcard-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vcard-email">Email (optional)</Label>
            <Input
              id="vcard-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
            />
          </div>

          <Button onClick={download} disabled={!vcard}>
            <Download className="mr-2 h-4 w-4" />
            Download vCard
          </Button>
        </div>

        <div className="flex flex-col items-center gap-3">
          {vcard ? (
            <>
              <div className="rounded-md bg-white p-4">
                <QRCodeSVG value={vcard} size={200} level="M" marginSize={0} />
              </div>
              <p className="text-sm text-muted-foreground">
                Scan to add contact
              </p>
            </>
          ) : (
            <div className="flex h-[232px] w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              Enter a name to generate a QR code
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
