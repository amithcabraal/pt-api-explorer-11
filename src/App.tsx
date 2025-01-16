import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import Controls from './components/Controls';
import { nodeTypes } from './components/flow-config/nodeTypes';
import { edgeTypes } from './components/flow-config/edgeTypes';
import { parseRoutes } from './utils/routeParser';
import { createNodesAndEdges } from './utils/layoutGenerator';
import { setAllRoutes } from './components/edge/utils';
import { loadNodePositions, saveNodePositions } from './utils/storage';
import type { FlowData } from './utils/storage';

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showUploadDialog, setShowUploadDialog] = useState(true);
  const [currentRoutesData, setCurrentRoutesData] = useState<string>();
  const [lastLoadedData, setLastLoadedData] = useState<FlowData | null>(null);

  // Load saved positions
  useEffect(() => {
    const savedPositions = loadNodePositions();
    if (savedPositions.length > 0) {
      setNodes(nodes.map(node => {
        const savedPosition = savedPositions.find(pos => pos.id === node.id);
        return savedPosition 
          ? { ...node, position: savedPosition.position }
          : node;
      }));
    }
  }, []);

  // Save positions when nodes change
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    
    const hasPositionChange = changes.some(change => 
      change.type === 'position' && change.dragging === false
    );
    
    if (hasPositionChange) {
      const positions = nodes.map(node => ({
        id: node.id,
        position: node.position
      }));
      saveNodePositions(positions);
    }
  }, [nodes, onNodesChange]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const handleDataLoad = useCallback((data: string, layout?: { nodes: any[]; edges: any[] }) => {
    try {
      // Try to parse as JSON first (for files with layout)
      const jsonData = JSON.parse(data) as FlowData;
      setNodes(jsonData.layout.nodes);
      setEdges(jsonData.layout.edges.map(edge => ({
        ...edge,
        data: {
          ...edge.data,
          originalApiCalls: edge.data.apiCalls // Store original API calls
        }
      })));
      setAllRoutes(parseRoutes(jsonData.routes));
      setCurrentRoutesData(jsonData.routes);
      setLastLoadedData(jsonData); // Store the loaded data
    } catch {
      // If JSON parsing fails, treat as raw routes data
      const routes = parseRoutes(data);
      const { nodes: newNodes, edges: newEdges } = createNodesAndEdges(routes);
      const edgesWithOriginal = newEdges.map(edge => ({
        ...edge,
        data: {
          ...edge.data,
          originalApiCalls: edge.data.apiCalls // Store original API calls
        }
      }));
      setNodes(newNodes);
      setEdges(edgesWithOriginal);
      setAllRoutes(routes);
      setCurrentRoutesData(data);
      setLastLoadedData({ routes: data, layout: { nodes: newNodes, edges: edgesWithOriginal } });
    }
    setShowUploadDialog(false);
  }, [setNodes, setEdges]);

  const handleReset = useCallback(() => {
    if (lastLoadedData) {
      setNodes(lastLoadedData.layout.nodes);
      setEdges(lastLoadedData.layout.edges);
      setAllRoutes(parseRoutes(lastLoadedData.routes));
    }
  }, [lastLoadedData, setNodes, setEdges]);

  return (
    <div className="w-screen h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background />
        <Controls 
          onDataLoad={handleDataLoad} 
          showUploadDialog={showUploadDialog}
          routesData={currentRoutesData}
          onReset={handleReset}
        />
      </ReactFlow>
    </div>
  );
}

export default App;