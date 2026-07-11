import {
  Binary,
  CalendarClock,
  FileDigit,
  Fingerprint,
  Hash,
  type LucideIcon,
  Network,
  Radio,
  RadioTower,
  Waypoints,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { Base62Tool } from '@/pages/tools/base62'
import { Base64Tool } from '@/pages/tools/base64'
import { HashingTool } from '@/pages/tools/hashing'
import { Ipv4SubnetTool } from '@/pages/tools/ipv4-subnet'
import { Ipv6SubnetTool } from '@/pages/tools/ipv6-subnet'
import { NatoTool } from '@/pages/tools/nato'
import { RfChannelTool } from '@/pages/tools/rf-channel'
import { ScheduleTool } from '@/pages/tools/schedule'
import { UuidTool } from '@/pages/tools/uuid'

/**
 * Central registry of every tool in the app.
 *
 * Adding a tool = one entry here + its page component. The sidebar nav and the
 * router both read from this list, so nothing else needs touching.
 */
export type Tool = {
  /** Stable id, also used as the React key. */
  id: string
  /** Display name shown in the nav. */
  name: string
  /** Route path, mounted under the root layout. */
  path: string
  /** One-line description for the tool card / landing. */
  description: string
  /** Nav icon. */
  icon: LucideIcon
  /** Page component rendered at `path`. */
  component: ComponentType
}

export const tools: Tool[] = [
  {
    id: 'base64',
    name: 'Base64',
    path: '/tools/base64',
    description: 'Encode and decode Base64 strings (UTF-8 safe).',
    icon: Binary,
    component: Base64Tool,
  },
  {
    id: 'base62',
    name: 'Base62',
    path: '/tools/base62',
    description: 'Encode and decode Base62 strings (UTF-8 safe).',
    icon: Hash,
    component: Base62Tool,
  },
  {
    id: 'ipv4-subnet',
    name: 'IPv4 Subnet',
    path: '/tools/ipv4-subnet',
    description: 'Calculate IPv4 network, broadcast, range and netmask.',
    icon: Network,
    component: Ipv4SubnetTool,
  },
  {
    id: 'ipv6-subnet',
    name: 'IPv6 Subnet',
    path: '/tools/ipv6-subnet',
    description: 'Calculate IPv6 network, range and netmask.',
    icon: Waypoints,
    component: Ipv6SubnetTool,
  },
  {
    id: 'nato',
    name: 'NATO Phonetic',
    path: '/tools/nato',
    description: 'Spell text with the NATO phonetic alphabet.',
    icon: Radio,
    component: NatoTool,
  },
  {
    id: 'uuid',
    name: 'UUID',
    path: '/tools/uuid',
    description:
      'Generate v1, v4, v5 and v7 UUIDs, plus nil and max constants.',
    icon: Fingerprint,
    component: UuidTool,
  },
  {
    id: 'schedule',
    name: 'Cron / systemd',
    path: '/tools/schedule',
    description:
      'Convert between cron, systemd OnCalendar and a date/time picker.',
    icon: CalendarClock,
    component: ScheduleTool,
  },
  {
    id: 'rf-channel',
    name: 'RF Channel',
    path: '/tools/rf-channel',
    description: 'Generate evenly spaced RF channels from a base frequency.',
    icon: RadioTower,
    component: RfChannelTool,
  },
  {
    id: 'hashing',
    name: 'Hashing',
    path: '/tools/hashing',
    description: 'Hash text or files with MD5, SHA-1, SHA-2 and SHA-3.',
    icon: FileDigit,
    component: HashingTool,
  },
]
