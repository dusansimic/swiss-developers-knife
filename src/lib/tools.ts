import {
  ArrowLeftRight,
  Binary,
  Calculator,
  CalendarClock,
  Contact,
  Container,
  Dices,
  FileDigit,
  Fingerprint,
  Hash,
  type LucideIcon,
  Network,
  PawPrint,
  Radio,
  RadioTower,
  Ruler,
  Scale,
  Sigma,
  Vote,
  Waypoints,
} from 'lucide-react'
import { type ComponentType, type LazyExoticComponent, lazy } from 'react'

/**
 * Tool pages are code-split: each is a lazy chunk loaded only when its route is
 * opened. Keeps heavy deps (e.g. React Flow) out of the initial bundle. The
 * named export is unwrapped to the `default` React.lazy expects.
 */
const Base64Tool = lazy(() =>
  import('@/pages/tools/base64').then((m) => ({ default: m.Base64Tool })),
)
const Base62Tool = lazy(() =>
  import('@/pages/tools/base62').then((m) => ({ default: m.Base62Tool })),
)
const BaseConverterTool = lazy(() =>
  import('@/pages/tools/base-converter').then((m) => ({
    default: m.BaseConverterTool,
  })),
)
const FloatConverterTool = lazy(() =>
  import('@/pages/tools/float-converter').then((m) => ({
    default: m.FloatConverterTool,
  })),
)
const VotingTool = lazy(() =>
  import('@/pages/tools/voting').then((m) => ({ default: m.VotingTool })),
)
const Ipv4SubnetTool = lazy(() =>
  import('@/pages/tools/ipv4-subnet').then((m) => ({
    default: m.Ipv4SubnetTool,
  })),
)
const Ipv6SubnetTool = lazy(() =>
  import('@/pages/tools/ipv6-subnet').then((m) => ({
    default: m.Ipv6SubnetTool,
  })),
)
const PhoneticTool = lazy(() =>
  import('@/pages/tools/phonetic').then((m) => ({ default: m.PhoneticTool })),
)
const UuidTool = lazy(() =>
  import('@/pages/tools/uuid').then((m) => ({ default: m.UuidTool })),
)
const RandomBytesTool = lazy(() =>
  import('@/pages/tools/random-bytes').then((m) => ({
    default: m.RandomBytesTool,
  })),
)
const AdjectiveAnimalTool = lazy(() =>
  import('@/pages/tools/adjective-animal').then((m) => ({
    default: m.AdjectiveAnimalTool,
  })),
)
const ScheduleTool = lazy(() =>
  import('@/pages/tools/schedule').then((m) => ({ default: m.ScheduleTool })),
)
const RfChannelTool = lazy(() =>
  import('@/pages/tools/rf-channel').then((m) => ({
    default: m.RfChannelTool,
  })),
)
const HashingTool = lazy(() =>
  import('@/pages/tools/hashing').then((m) => ({ default: m.HashingTool })),
)
const FormatConverterTool = lazy(() =>
  import('@/pages/tools/format-converter').then((m) => ({
    default: m.FormatConverterTool,
  })),
)
const DockerComposeTool = lazy(() =>
  import('@/pages/tools/docker-compose').then((m) => ({
    default: m.DockerComposeTool,
  })),
)
const UnitConverterTool = lazy(() =>
  import('@/pages/tools/unit-converter').then((m) => ({
    default: m.UnitConverterTool,
  })),
)
const LicensesTool = lazy(() =>
  import('@/pages/tools/licenses').then((m) => ({ default: m.LicensesTool })),
)
const VcardTool = lazy(() =>
  import('@/pages/tools/vcard').then((m) => ({ default: m.VcardTool })),
)

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
  /** Page component rendered at `path` (lazy-loaded chunk). */
  component: LazyExoticComponent<ComponentType>
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
    id: 'base-converter',
    name: 'Base Converter',
    path: '/tools/base-converter',
    description:
      'Convert between binary, octal, decimal and hex with signed/unsigned.',
    icon: Calculator,
    component: BaseConverterTool,
  },
  {
    id: 'float-converter',
    name: 'Float Converter',
    path: '/tools/float-converter',
    description:
      'Convert between decimal and IEEE 754 float/double binary bits.',
    icon: Sigma,
    component: FloatConverterTool,
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
    id: 'phonetic',
    name: 'Phonetic Alphabet',
    path: '/tools/phonetic',
    description: 'Spell text with the NATO or Serbian phonetic alphabet.',
    icon: Radio,
    component: PhoneticTool,
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
    id: 'random-bytes',
    name: 'Random Bytes',
    path: '/tools/random-bytes',
    description:
      'Generate secure random bytes as hex, Base64 or Base62 (openssl rand).',
    icon: Dices,
    component: RandomBytesTool,
  },
  {
    id: 'adjective-animal',
    name: 'Adjective Animal',
    path: '/tools/adjective-animal',
    description:
      'Generate random adjective + animal names in English or Serbian.',
    icon: PawPrint,
    component: AdjectiveAnimalTool,
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
  {
    id: 'format-converter',
    name: 'JSON / YAML / TOML',
    path: '/tools/format-converter',
    description: 'Convert structured data between JSON, YAML and TOML.',
    icon: ArrowLeftRight,
    component: FormatConverterTool,
  },
  {
    id: 'docker-compose',
    name: 'Docker Compose',
    path: '/tools/docker-compose',
    description: 'Render Compose services, networks and volumes as a diagram.',
    icon: Container,
    component: DockerComposeTool,
  },
  {
    id: 'voting',
    name: 'Preferential Voting',
    path: '/tools/voting',
    description:
      'Run instant-runoff (ranked-choice) voting with per-round results.',
    icon: Vote,
    component: VotingTool,
  },
  {
    id: 'unit-converter',
    name: 'Unit Converter',
    path: '/tools/unit-converter',
    description: 'Convert length, weight, temperature, speed, area and volume.',
    icon: Ruler,
    component: UnitConverterTool,
  },
  {
    id: 'licenses',
    name: 'Licenses',
    path: '/tools/licenses',
    description: 'Copy full text of BSD, GPL and LGPL open source licenses.',
    icon: Scale,
    component: LicensesTool,
  },
  {
    id: 'vcard',
    name: 'vCard',
    path: '/tools/vcard',
    description:
      'Generate a contact vCard with a downloadable file and QR code.',
    icon: Contact,
    component: VcardTool,
  },
]
