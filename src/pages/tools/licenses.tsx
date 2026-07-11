import { Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fillLicense, LICENSES } from '@/lib/licenses'

const YEAR = new Date().getFullYear()

export function LicensesTool() {
  const [licenseId, setLicenseId] = useState(LICENSES[0]?.id ?? '')
  const [name, setName] = useState('')

  const license = LICENSES.find((l) => l.id === licenseId) ?? LICENSES[0]

  const text = useMemo(
    () => (license ? fillLicense(license.text, name, YEAR) : ''),
    [license, name],
  )

  async function copy() {
    await navigator.clipboard.writeText(text)
    toast.success(`${license?.name} copied to clipboard`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Licenses</h1>
        <p className="text-muted-foreground">
          Copy the full text of a common open source license. The copyright name
          fills the placeholder (left as <code>&lt;name&gt;</code> when empty);
          the year defaults to {YEAR}.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-56 space-y-2">
          <Label htmlFor="license-select">License</Label>
          <Select value={licenseId} onValueChange={setLicenseId}>
            <SelectTrigger id="license-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LICENSES.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-64 space-y-2">
          <Label htmlFor="license-name">Copyright holder</Label>
          <Input
            id="license-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Text</Label>
          <Button variant="outline" size="sm" onClick={copy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
        </div>
        <pre className="max-h-[36rem] overflow-auto rounded-md border bg-card p-4 font-mono text-xs leading-relaxed whitespace-pre">
          {text}
        </pre>
      </div>
    </div>
  )
}
