import { parse } from 'yaml'

/**
 * Parse Docker Compose file text into a graph model: service, network and
 * volume nodes plus the edges between them. Each service keeps its full raw
 * parsed map (`raw`) so the UI can show every field, not just the summarised
 * ones.
 */

export interface ComposePort {
  /** Host-published port, if any. */
  published?: string
  /** Container port. */
  target: string
  /** Protocol (tcp/udp), if specified. */
  protocol?: string
  /** Original, unparsed value for display. */
  raw: string
}

export type MountKind = 'volume' | 'bind' | 'tmpfs' | 'npipe'

export interface ComposeMount {
  kind: MountKind
  /** Named volume name or host path. Absent for anonymous/tmpfs. */
  source?: string
  /** Path inside the container. */
  target: string
  readOnly: boolean
  /** Original, unparsed value for display. */
  raw: string
}

export interface ComposeService {
  name: string
  image?: string
  build?: string
  containerName?: string
  command?: string
  restart?: string
  ports: ComposePort[]
  environment: Record<string, string>
  mounts: ComposeMount[]
  /** Network names this service joins. */
  networks: string[]
  /** Service names this one depends on. */
  dependsOn: string[]
  profiles: string[]
  /** Full raw service map, for the details modal. */
  raw: Record<string, unknown>
}

export interface ComposeNetwork {
  name: string
  driver?: string
  external: boolean
  /** True when synthesised from the implicit `default` network. */
  implicit: boolean
}

export interface ComposeVolume {
  name: string
  driver?: string
  external: boolean
}

export type ComposeEdgeKind = 'network' | 'volume' | 'depends_on'

export interface ComposeEdge {
  from: string
  to: string
  kind: ComposeEdgeKind
}

export interface ComposeGraph {
  services: ComposeService[]
  networks: ComposeNetwork[]
  volumes: ComposeVolume[]
  edges: ComposeEdge[]
}

export type ParseResult =
  | { ok: true; graph: ComposeGraph }
  | { ok: false; error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Coerce a scalar (string/number/boolean) to a display string. */
function scalar(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  if (Array.isArray(value)) return value.map((v) => scalar(v)).join(' ')
  if (isRecord(value)) return undefined
  return String(value)
}

/** Parse an environment block (map or `KEY=value` list) into a flat map. */
function parseEnvironment(value: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (isRecord(value)) {
    for (const [k, v] of Object.entries(value)) {
      out[k] = v === null || v === undefined ? '' : String(v)
    }
  } else if (Array.isArray(value)) {
    for (const entry of value) {
      const str = String(entry)
      const eq = str.indexOf('=')
      if (eq === -1) out[str] = ''
      else out[str.slice(0, eq)] = str.slice(eq + 1)
    }
  }
  return out
}

/** Keys (or list items) of a map/list block, ignoring their values. */
function keysOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v))
  if (isRecord(value)) return Object.keys(value)
  return []
}

function parsePort(entry: unknown): ComposePort {
  if (isRecord(entry)) {
    const target = scalar(entry.target) ?? ''
    const published = scalar(entry.published)
    const protocol = scalar(entry.protocol)
    const raw = [published, target].filter(Boolean).join(':')
    return {
      target,
      published,
      protocol,
      raw: protocol ? `${raw}/${protocol}` : raw || target,
    }
  }
  const raw = String(entry)
  // Strip optional /proto, optional host IP, then split published:target.
  const [hostPart, proto] = raw.split('/')
  const parts = hostPart.split(':')
  const target = parts[parts.length - 1] ?? raw
  const published = parts.length >= 2 ? parts[parts.length - 2] : undefined
  return { target, published, protocol: proto, raw }
}

/** Classify a short-syntax source token as a bind mount or named volume. */
function isBindPath(source: string): boolean {
  return (
    source.startsWith('.') ||
    source.startsWith('/') ||
    source.startsWith('~') ||
    /^[A-Za-z]:[\\/]/.test(source) // Windows drive path
  )
}

function parseMount(entry: unknown): ComposeMount {
  if (isRecord(entry)) {
    const kind = (scalar(entry.type) ?? 'volume') as MountKind
    return {
      kind,
      source: scalar(entry.source),
      target: scalar(entry.target) ?? '',
      readOnly: entry.read_only === true,
      raw:
        [scalar(entry.source), scalar(entry.target)]
          .filter(Boolean)
          .join(':') ||
        (scalar(entry.target) ?? ''),
    }
  }
  const raw = String(entry)
  const parts = raw.split(':')
  // Anonymous volume: single path inside container.
  if (parts.length === 1) {
    return { kind: 'volume', target: parts[0], readOnly: false, raw }
  }
  const source = parts[0]
  const target = parts[1] ?? ''
  const mode = parts[2] ?? ''
  return {
    kind: isBindPath(source) ? 'bind' : 'volume',
    source,
    target,
    readOnly: mode.split(',').includes('ro'),
    raw,
  }
}

export function parseCompose(text: string): ParseResult {
  if (text.trim() === '') {
    return { ok: false, error: 'Paste a Docker Compose file to render it.' }
  }

  let doc: unknown
  try {
    doc = parse(text)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Invalid YAML: ${message}` }
  }

  if (!isRecord(doc)) {
    return { ok: false, error: 'Compose file must be a YAML mapping.' }
  }

  const servicesRaw = doc.services
  if (!isRecord(servicesRaw)) {
    return { ok: false, error: 'No `services:` section found.' }
  }

  const topNetworks = isRecord(doc.networks) ? doc.networks : {}
  const topVolumes = isRecord(doc.volumes) ? doc.volumes : {}

  const services: ComposeService[] = []
  const edges: ComposeEdge[] = []
  const usedNetworks = new Set<string>()
  const usedVolumes = new Set<string>()
  const serviceNames = new Set(Object.keys(servicesRaw))

  for (const [name, rawValue] of Object.entries(servicesRaw)) {
    const raw = isRecord(rawValue) ? rawValue : {}

    const ports = Array.isArray(raw.ports) ? raw.ports.map(parsePort) : []
    const mounts = Array.isArray(raw.volumes) ? raw.volumes.map(parseMount) : []
    const networks =
      raw.networks === undefined ? ['default'] : keysOf(raw.networks)
    const dependsOn = keysOf(raw.depends_on)
    const profiles = keysOf(raw.profiles)

    const build = isRecord(raw.build)
      ? (scalar(raw.build.context) ?? '(build)')
      : scalar(raw.build)

    services.push({
      name,
      image: scalar(raw.image),
      build,
      containerName: scalar(raw.container_name),
      command: scalar(raw.command),
      restart: scalar(raw.restart),
      ports,
      environment: parseEnvironment(raw.environment),
      mounts,
      networks,
      dependsOn,
      profiles,
      raw,
    })

    for (const net of networks) {
      usedNetworks.add(net)
      edges.push({ from: name, to: `net:${net}`, kind: 'network' })
    }

    for (const mount of mounts) {
      if (mount.kind === 'volume' && mount.source) {
        usedVolumes.add(mount.source)
        edges.push({ from: name, to: `vol:${mount.source}`, kind: 'volume' })
      }
    }

    for (const dep of dependsOn) {
      if (serviceNames.has(dep)) {
        edges.push({ from: name, to: dep, kind: 'depends_on' })
      }
    }
  }

  // Union of declared + referenced networks.
  const networkNames = new Set<string>([
    ...Object.keys(topNetworks),
    ...usedNetworks,
  ])
  const networks: ComposeNetwork[] = [...networkNames].map((netName) => {
    const def = topNetworks[netName]
    const config = isRecord(def) ? def : undefined
    return {
      name: netName,
      driver: config ? scalar(config.driver) : undefined,
      external: config?.external === true,
      implicit: !(netName in topNetworks),
    }
  })

  const volumeNames = new Set<string>([
    ...Object.keys(topVolumes),
    ...usedVolumes,
  ])
  const volumes: ComposeVolume[] = [...volumeNames].map((volName) => {
    const def = topVolumes[volName]
    const config = isRecord(def) ? def : undefined
    return {
      name: volName,
      driver: config ? scalar(config.driver) : undefined,
      external: config?.external === true,
    }
  })

  return { ok: true, graph: { services, networks, volumes, edges } }
}
