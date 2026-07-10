import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { ResultField } from '@/components/result-field'
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
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  generateV1,
  generateV4,
  generateV5,
  generateV7,
  MAX_UUID,
  NAMESPACES,
  type NamespaceKey,
  NIL_UUID,
} from '@/lib/uuid'

export function UuidTool() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">UUID Generator</h1>
        <p className="text-muted-foreground">
          Generate UUIDs of every practical version. v4 is random, v7 is
          time-ordered and sortable, v1 is timestamp-based, and v5 is
          deterministic from a namespace and name.
        </p>
      </div>

      <Tabs defaultValue="v4">
        <TabsList>
          <TabsTrigger value="v4">v4</TabsTrigger>
          <TabsTrigger value="v7">v7</TabsTrigger>
          <TabsTrigger value="v1">v1</TabsTrigger>
          <TabsTrigger value="v5">v5</TabsTrigger>
        </TabsList>

        <TabsContent value="v4" className="space-y-4">
          <SimpleGenerator
            description="Random UUID. The default choice when you just need a unique id."
            generate={generateV4}
          />
        </TabsContent>

        <TabsContent value="v7" className="space-y-4">
          <SimpleGenerator
            description="Unix-timestamp-ordered UUID. Lexicographically sortable — ideal as a database key."
            generate={generateV7}
          />
        </TabsContent>

        <TabsContent value="v1" className="space-y-4">
          <V1Generator />
        </TabsContent>

        <TabsContent value="v5" className="space-y-4">
          <V5Generator />
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="space-y-2">
        <p className="text-sm font-medium">Special constants</p>
        <ResultField label="Nil UUID" value={NIL_UUID} />
        <ResultField label="Max UUID" value={MAX_UUID} />
      </div>
    </div>
  )
}

interface SimpleGeneratorProps {
  description: string
  generate: () => string
}

function SimpleGenerator({ description, generate }: SimpleGeneratorProps) {
  const [value, setValue] = useState(() => generate())

  return (
    <>
      <p className="text-sm text-muted-foreground">{description}</p>
      <ResultField label="UUID" value={value} />
      <Button variant="secondary" onClick={() => setValue(generate())}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Generate
      </Button>
    </>
  )
}

function V1Generator() {
  const [mac, setMac] = useState('')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function generate() {
    try {
      setValue(generateV1(mac))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate.')
    }
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">
        Timestamp-based UUID. Leave the MAC blank to use a spec-compliant random
        node (browsers cannot read a hardware MAC), or enter one to pin the
        node.
      </p>
      <div className="space-y-2">
        <Label htmlFor="v1-mac">MAC address (optional)</Label>
        <Input
          id="v1-mac"
          value={mac}
          onChange={(e) => setMac(e.target.value)}
          placeholder="00:1a:2b:3c:4d:5e"
          className="font-mono"
          aria-invalid={error !== null}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      {value && <ResultField label="UUID" value={value} />}
      <Button variant="secondary" onClick={generate}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Generate
      </Button>
    </>
  )
}

function V5Generator() {
  const [namespaceKey, setNamespaceKey] = useState<NamespaceKey>('DNS')
  const [name, setName] = useState('')
  const [value, setValue] = useState('')

  function generate() {
    setValue(generateV5(name, NAMESPACES[namespaceKey]))
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">
        Deterministic UUID — the same namespace and name always produce the same
        UUID (SHA-1 based).
      </p>
      <div className="space-y-2">
        <Label htmlFor="v5-namespace">Namespace</Label>
        <Select
          value={namespaceKey}
          onValueChange={(v) => setNamespaceKey(v as NamespaceKey)}
        >
          <SelectTrigger id="v5-namespace" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(NAMESPACES) as NamespaceKey[]).map((key) => (
              <SelectItem key={key} value={key}>
                {key} — {NAMESPACES[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="v5-name">Name</Label>
        <Input
          id="v5-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="example.com"
          className="font-mono"
        />
      </div>
      {value && <ResultField label="UUID" value={value} />}
      <Button variant="secondary" onClick={generate}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Generate
      </Button>
    </>
  )
}
