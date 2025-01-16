import { Node, Edge } from 'reactflow';

const STORAGE_KEY = 'flow-node-positions';

export interface NodePosition {
  id: string;
  position: { x: number; y: number };
}

export interface FlowData {
  routes: string;
  layout: {
    nodes: Node[];
    edges: Edge[];
  };
}

export function saveNodePositions(positions: NodePosition[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch (error) {
    console.error('Failed to save node positions:', error);
  }
}

export function loadNodePositions(): NodePosition[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load node positions:', error);
    return [];
  }
}

export function downloadFlowData(routes: string, nodes: Node[], edges: Edge[]) {
  const data: FlowData = {
    routes,
    layout: { nodes, edges }
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `flow-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}