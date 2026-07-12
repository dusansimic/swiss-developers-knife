import { useMemo, useState } from 'react'
import { PrefixCombobox } from '@/components/prefix-combobox'
import { ResultField } from '@/components/result-field'
import { SubnetOverlaps } from '@/components/subnet-overlaps'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  calculateIpv6,
  DEFAULT_IPV6_FORMAT,
  IPV6_FORMATS,
  type Ipv6Format,
  ipv6PrefixOptions,
} from '@/lib/ipv6'
import { findReservedOverlapsV6, overlapsPublicV6 } from '@/lib/reserved-ips'

export function Ipv6SubnetTool() {
  const [address, setAddress] = useState('2001:db8:abcd:12::1')
  const [prefix, setPrefix] = useState('64')
  const [format, setFormat] = useState<Ipv6Format>(DEFAULT_IPV6_FORMAT)

  const prefixOptions = useMemo(() => ipv6PrefixOptions(format), [format])

  const result = useMemo(() => {
    try {
      return {
        data: calculateIpv6(address, Number(prefix), format),
        error: null,
      }
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Invalid input.',
      }
    }
  }, [address, prefix, format])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          IPv6 Subnet Calculator
        </h1>
        <p className="text-muted-foreground">
          Enter an address and prefix length to compute the subnet. Results
          update live.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="grow space-y-2">
          <Label htmlFor="ipv6-address">IPv6 address</Label>
          <Input
            id="ipv6-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="2001:db8::1"
            className="font-mono"
          />
        </div>
        <div className="w-72 space-y-2">
          <Label htmlFor="ipv6-prefix">Prefix (/0-128)</Label>
          <PrefixCombobox
            id="ipv6-prefix"
            value={prefix}
            onChange={setPrefix}
            options={prefixOptions}
            placeholder="64"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ipv6-format">Address representation</Label>
        <Select
          value={format}
          onValueChange={(value) => setFormat(value as Ipv6Format)}
        >
          <SelectTrigger id="ipv6-format" className="w-full sm:w-96">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {IPV6_FORMATS.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {result.error && (
        <p className="text-sm text-destructive">{result.error}</p>
      )}

      {result.data && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultField
              label="Network address"
              value={result.data.networkAddress}
            />
            <ResultField label="Netmask" value={result.data.netmask} />
            <ResultField
              label="Start address"
              value={result.data.startAddress}
            />
            <ResultField label="End address" value={result.data.endAddress} />
          </div>
          <SubnetOverlaps
            reserved={findReservedOverlapsV6(
              result.data.rangeStart,
              result.data.rangeEnd,
            )}
            publicOverlap={overlapsPublicV6(
              result.data.rangeStart,
              result.data.rangeEnd,
            )}
          />
        </div>
      )}
    </div>
  )
}
