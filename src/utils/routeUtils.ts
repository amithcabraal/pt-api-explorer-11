import { Edge, Node } from 'reactflow';

interface Route {
  path: string[];
  edges: Edge[];
}

export function findRoutes(matchingEdges: Edge[], nodes: Node[]): Route[] {
  const routes: Route[] = [];
  const adjacencyList = new Map<string, Edge[]>();

  // Build adjacency list from matching edges
  matchingEdges.forEach(edge => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    adjacencyList.get(edge.source)!.push(edge);
  });

  // Helper function to find all paths
  function findPaths(
    start: string,
    visited: Set<string> = new Set(),
    currentPath: string[] = [],
    currentEdges: Edge[] = []
  ) {
    visited.add(start);
    // Remove 'node-' prefix when adding to path
    currentPath.push(start.replace('node-', ''));

    const edges = adjacencyList.get(start) || [];
    for (const edge of edges) {
      if (!visited.has(edge.target)) {
        findPaths(
          edge.target,
          new Set(visited),
          [...currentPath],
          [...currentEdges, edge]
        );
      }
    }

    if (currentEdges.length > 0) {
      routes.push({
        path: currentPath,
        edges: currentEdges
      });
    }

    visited.delete(start);
  }

  // Find paths starting from each node
  nodes.forEach(node => {
    if (adjacencyList.has(node.id)) {
      findPaths(node.id);
    }
  });

  return routes;
}