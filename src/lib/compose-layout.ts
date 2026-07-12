import Dagre from '@dagrejs/dagre'
import type { ComposeGraph } from '@/lib/compose'

/**
 * Run a dagre directed-graph layout over the compose model and return the
 * top-left position for every node id. Node ids match the ids used when
 * building React Flow nodes: services by name, networks as `net:<name>`,
 * volumes as `vol:<name>`.
 */

export interface NodeBox {
  id: string
  width: number
  height: number
}

export interface Positioned {
  x: number
  y: number
}

export function layoutGraph(
  graph: ComposeGraph,
  boxes: Map<string, NodeBox>,
): Map<string, Positioned> {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: 'LR',
    nodesep: 40,
    ranksep: 90,
    marginx: 20,
    marginy: 20,
  })

  for (const box of boxes.values()) {
    g.setNode(box.id, { width: box.width, height: box.height })
  }

  for (const edge of graph.edges) {
    if (boxes.has(edge.from) && boxes.has(edge.to)) {
      g.setEdge(edge.from, edge.to)
    }
  }

  Dagre.layout(g)

  const positions = new Map<string, Positioned>()
  for (const box of boxes.values()) {
    const node = g.node(box.id)
    // dagre returns the node centre; React Flow wants the top-left corner.
    positions.set(box.id, {
      x: node.x - box.width / 2,
      y: node.y - box.height / 2,
    })
  }
  return positions
}
