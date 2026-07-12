import { useMemo, useState } from 'react'
import { PrefixCombobox } from '@/components/prefix-combobox'
import { ResultField } from '@/components/result-field'
import { SubnetOverlaps } from '@/components/subnet-overlaps'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { calculateIpv4, ipv4PrefixOptions } from '@/lib/ipv4'
import { findReservedOverlapsV4, overlapsPublicV4 } from '@/lib/reserved-ips'

const PREFIX_OPTIONS = ipv4PrefixOptions()

export function Ipv4SubnetTool() {
  const [address, setAddress] = useState('192.168.1.10')
  const [prefix, setPrefix] = useState('24')

  const result = useMemo(() => {
    try {
      return { data: calculateIpv4(address, Number(prefix)), error: null }
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Invalid input.',
      }
    }
  }, [address, prefix])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          IPv4 Subnet Calculator
        </h1>
        <p className="text-muted-foreground">
          Enter an address and prefix length to compute the subnet. Results
          update live.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="grow space-y-2">
          <Label htmlFor="ipv4-address">IP address</Label>
          <Input
            id="ipv4-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="192.168.1.10"
            className="font-mono"
          />
        </div>
        <div className="w-56 space-y-2">
          <Label htmlFor="ipv4-prefix">Prefix (/0-32)</Label>
          <PrefixCombobox
            id="ipv4-prefix"
            value={prefix}
            onChange={setPrefix}
            options={PREFIX_OPTIONS}
            placeholder="24"
          />
        </div>
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
            <ResultField
              label="Broadcast address"
              value={result.data.broadcastAddress}
            />
            <ResultField
              label="Usable hosts"
              value={result.data.usableHosts.toLocaleString()}
            />
          </div>
          <SubnetOverlaps
            reserved={findReservedOverlapsV4(
              result.data.rangeStart,
              result.data.rangeEnd,
            )}
            publicOverlap={overlapsPublicV4(
              result.data.rangeStart,
              result.data.rangeEnd,
            )}
          />
        </div>
      )}
    </div>
  )
}
