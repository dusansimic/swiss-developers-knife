import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  Handle,
  MiniMap,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Boxes, Database, Network, Server } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { stringify } from 'yaml'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  type ComposeGraph,
  type ComposeService,
  parseCompose,
} from '@/lib/compose'
import { layoutGraph, type NodeBox } from '@/lib/compose-layout'

const EXAMPLE = `services:
  web:
    image: nginx:1.27
    container_name: web
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
    networks:
      - frontend
    volumes:
      - ./site:/usr/share/nginx/html:ro
    restart: unless-stopped

  api:
    build: ./api
    environment:
      DATABASE_URL: postgres://db:5432/app
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - db
    networks:
      - frontend
      - backend

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - backend

networks:
  frontend:
  backend:
    driver: bridge

volumes:
  pgdata:
`

const NODE_SIZES = {
  service: { width: 240, height: 120 },
  network: { width: 190, height: 72 },
  volume: { width: 190, height: 72 },
} as const

const EDGE_COLORS: Record<string, string> = {
  network: 'var(--chart-2)',
  volume: 'var(--chart-3)',
  depends_on: 'var(--muted-foreground)',
}

type ServiceNodeData = { service: ComposeService }
type LabelNodeData = { label: string; sub?: string }

function ServiceNode({ data }: NodeProps<Node<ServiceNodeData, 'service'>>) {
  const { service } = data
  return (
    <div className="w-[240px] rounded-lg border border-border bg-card px-3 py-2.5 text-card-foreground shadow-sm transition-shadow hover:shadow-md">
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <Handle type="source" position={Position.Right} className="!bg-primary" />
      <div className="flex items-center gap-2">
        <Server className="h-4 w-4 shrink-0 text-primary" />
        <span className="truncate font-semibold text-sm">{service.name}</span>
      </div>
      {service.image ? (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {service.image}
        </p>
      ) : service.build ? (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          build: {service.build}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-1">
        {service.ports.length > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            {service.ports.length} port{service.ports.length > 1 ? 's' : ''}
          </Badge>
        )}
        {service.networks.length > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            {service.networks.length} net
          </Badge>
        )}
        {service.mounts.length > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            {service.mounts.length} vol
          </Badge>
        )}
        {service.dependsOn.length > 0 && (
          <Badge variant="outline" className="text-[10px]">
            depends_on {service.dependsOn.length}
          </Badge>
        )}
      </div>
    </div>
  )
}

function NetworkNode({ data }: NodeProps<Node<LabelNodeData, 'network'>>) {
  return (
    <div className="w-[190px] rounded-lg border border-border border-dashed bg-secondary px-3 py-2.5 text-secondary-foreground">
      <Handle type="target" position={Position.Left} className="!bg-chart-2" />
      <Handle type="source" position={Position.Right} className="!bg-chart-2" />
      <div className="flex items-center gap-2">
        <Network
          className="h-4 w-4 shrink-0"
          style={{ color: 'var(--chart-2)' }}
        />
        <span className="truncate font-medium text-sm">{data.label}</span>
      </div>
      {data.sub ? (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {data.sub}
        </p>
      ) : null}
    </div>
  )
}

function VolumeNode({ data }: NodeProps<Node<LabelNodeData, 'volume'>>) {
  return (
    <div className="w-[190px] rounded-lg border border-border bg-muted px-3 py-2.5 text-foreground">
      <Handle type="target" position={Position.Left} className="!bg-chart-3" />
      <Handle type="source" position={Position.Right} className="!bg-chart-3" />
      <div className="flex items-center gap-2">
        <Database
          className="h-4 w-4 shrink-0"
          style={{ color: 'var(--chart-3)' }}
        />
        <span className="truncate font-medium text-sm">{data.label}</span>
      </div>
      {data.sub ? (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {data.sub}
        </p>
      ) : null}
    </div>
  )
}

const nodeTypes = {
  service: ServiceNode,
  network: NetworkNode,
  volume: VolumeNode,
}

function buildFlow(graph: ComposeGraph): { nodes: Node[]; edges: Edge[] } {
  const boxes = new Map<string, NodeBox>()
  for (const s of graph.services) {
    boxes.set(s.name, { id: s.name, ...NODE_SIZES.service })
  }
  for (const n of graph.networks) {
    boxes.set(`net:${n.name}`, { id: `net:${n.name}`, ...NODE_SIZES.network })
  }
  for (const v of graph.volumes) {
    boxes.set(`vol:${v.name}`, { id: `vol:${v.name}`, ...NODE_SIZES.volume })
  }

  const pos = layoutGraph(graph, boxes)
  const at = (id: string) => pos.get(id) ?? { x: 0, y: 0 }

  const nodes: Node[] = [
    ...graph.services.map(
      (service): Node<ServiceNodeData, 'service'> => ({
        id: service.name,
        type: 'service',
        position: at(service.name),
        data: { service },
      }),
    ),
    ...graph.networks.map((net): Node<LabelNodeData, 'network'> => {
      const tags = [
        net.external ? 'external' : undefined,
        net.implicit ? 'implicit' : undefined,
        net.driver,
      ].filter(Boolean)
      return {
        id: `net:${net.name}`,
        type: 'network',
        position: at(`net:${net.name}`),
        data: { label: net.name, sub: tags.join(' · ') || 'network' },
      }
    }),
    ...graph.volumes.map((vol): Node<LabelNodeData, 'volume'> => {
      const tags = [vol.external ? 'external' : undefined, vol.driver].filter(
        Boolean,
      )
      return {
        id: `vol:${vol.name}`,
        type: 'volume',
        position: at(`vol:${vol.name}`),
        data: { label: vol.name, sub: tags.join(' · ') || 'volume' },
      }
    }),
  ]

  const edges: Edge[] = graph.edges.map((e, i) => ({
    id: `${e.kind}-${e.from}-${e.to}-${i}`,
    source: e.from,
    target: e.to,
    animated: e.kind === 'depends_on',
    style: {
      stroke: EDGE_COLORS[e.kind],
      strokeDasharray: e.kind === 'depends_on' ? '5 5' : undefined,
    },
  }))

  return { nodes, edges }
}

/** Render a key/value row for the service details modal. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-words font-mono text-xs">{value}</span>
    </div>
  )
}

function ServiceDetails({ service }: { service: ComposeService }) {
  const envEntries = Object.entries(service.environment)
  return (
    <div className="space-y-4">
      <div>
        {service.image && <DetailRow label="image" value={service.image} />}
        {service.build && <DetailRow label="build" value={service.build} />}
        {service.containerName && (
          <DetailRow label="container" value={service.containerName} />
        )}
        {service.command && (
          <DetailRow label="command" value={service.command} />
        )}
        {service.restart && (
          <DetailRow label="restart" value={service.restart} />
        )}
        {service.profiles.length > 0 && (
          <DetailRow label="profiles" value={service.profiles.join(', ')} />
        )}
        {service.dependsOn.length > 0 && (
          <DetailRow label="depends_on" value={service.dependsOn.join(', ')} />
        )}
        {service.networks.length > 0 && (
          <DetailRow label="networks" value={service.networks.join(', ')} />
        )}
      </div>

      {service.ports.length > 0 && (
        <div>
          <h4 className="mb-1 text-sm font-semibold">Ports</h4>
          <div className="flex flex-wrap gap-1.5">
            {service.ports.map((p) => (
              <Badge key={p.raw} variant="secondary" className="font-mono">
                {p.raw}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {service.mounts.length > 0 && (
        <div>
          <h4 className="mb-1 text-sm font-semibold">Volumes &amp; mounts</h4>
          <div className="space-y-1">
            {service.mounts.map((m) => (
              <div key={m.raw} className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="shrink-0">
                  {m.kind}
                  {m.readOnly ? ' · ro' : ''}
                </Badge>
                <span className="break-all font-mono">{m.raw}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {envEntries.length > 0 && (
        <div>
          <h4 className="mb-1 text-sm font-semibold">Environment</h4>
          <div className="space-y-0.5">
            {envEntries.map(([k, v]) => (
              <div key={k} className="font-mono text-xs">
                <span className="text-primary">{k}</span>
                <span className="text-muted-foreground">={v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="mb-1 text-sm font-semibold">Full definition</h4>
        <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
          {stringify(service.raw).trimEnd()}
        </pre>
      </div>
    </div>
  )
}

export function DockerComposeTool() {
  const [text, setText] = useState('')
  const [selected, setSelected] = useState<ComposeService | null>(null)

  const result = useMemo(() => parseCompose(text), [text])
  const flow = useMemo(
    () => (result.ok ? buildFlow(result.graph) : { nodes: [], edges: [] }),
    [result],
  )

  const serviceByName = useMemo(() => {
    const map = new Map<string, ComposeService>()
    if (result.ok) for (const s of result.graph.services) map.set(s.name, s)
    return map
  }, [result])

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const service = serviceByName.get(node.id)
      if (service) setSelected(service)
    },
    [serviceByName],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Docker Compose Diagram
        </h1>
        <p className="text-muted-foreground">
          Paste a Compose file to render its services, networks and volumes.
          Click a service to inspect its full definition.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">compose.yaml</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setText(EXAMPLE)}
            disabled={text === EXAMPLE}
          >
            Load example
          </Button>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your docker-compose.yml here…"
          spellCheck={false}
          className="min-h-[180px] font-mono text-xs"
        />
      </div>

      <div className="h-[600px] w-full overflow-hidden rounded-lg border border-border">
        {result.ok ? (
          <ReactFlow
            nodes={flow.nodes}
            edges={flow.edges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            colorMode="system"
            proOptions={{ hideAttribution: true }}
            nodesConnectable={false}
            nodesDraggable
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable className="!bg-card" />
          </ReactFlow>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
            {result.error}
          </div>
        )}
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-primary" />
              {selected?.name}
            </DialogTitle>
            <DialogDescription>Service definition</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-4">
            {selected && <ServiceDetails service={selected} />}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
