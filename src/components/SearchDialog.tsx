import { useState, useCallback, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, X, RotateCcw, GripVertical, Maximize2, Minimize2 } from 'lucide-react';
import { useReactFlow, Edge } from 'reactflow';
import { clsx } from 'clsx';
import { TreeView } from './edge/TreeView';
import type { ApiCall } from './edge/types';
import { findRoutes } from '../utils/routeUtils';

interface SearchDialogProps {
  onHighlight: (edgeId: string | null) => void;
  className?: string;
}

interface Route {
  path: string[];
  edges: Edge[];
}

function buildApiCallTree(edges: Edge[], searchTerm: string): ApiCall[] {
  const searchLower = searchTerm.toLowerCase();
  const result: ApiCall[] = [];
  
  // Process only the first level edges (from Client)
  edges.filter(edge => edge.source === 'Client').forEach(edge => {
    if (!edge.data?.apiCalls) return;
    
    // Filter and transform the API calls
    edge.data.apiCalls.forEach(call => {
      // Check if this call or any of its nested calls match the search term
      const hasMatch = call.path.toLowerCase().includes(searchLower) ||
                      (call.calls || []).some(nestedCall => 
                        nestedCall.path.toLowerCase().includes(searchLower));
      
      if (hasMatch) {
        // Create the top-level call
        const transformedCall: ApiCall = {
          method: call.method,
          path: call.path,
          service: edge.target,
          controller: call.controller,
          operation: call.operation,
          controllerFilePath: call.controllerFilePath,
          calls: []
        };

        // Find and add nested calls from other edges
        if (call.calls) {
          transformedCall.calls = call.calls.map(nestedCall => {
            const nestedService = nestedCall.service || nestedCall.client;
            
            // Find the edge that connects to this service
            const nextEdge = edges.find(e => 
              e.source === edge.target && 
              e.target === nestedService
            );

            return {
              method: nestedCall.method,
              path: nestedCall.path,
              service: nestedService,
              controller: nestedCall.controller,
              operation: nestedCall.operation,
              controllerFilePath: nestedCall.controllerFilePath,
              calls: nestedCall.calls || []
            };
          });
        }

        // Only add if we haven't already added this exact call
        const key = `${transformedCall.method}-${transformedCall.path}-${transformedCall.service}`;
        if (!result.some(existing => 
          `${existing.method}-${existing.path}-${existing.service}` === key
        )) {
          result.push(transformedCall);
        }
      }
    });
  });

  return result;
}

export function SearchDialog({ onHighlight, className }: SearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{ count: number; message: string; routes: Route[] } | null>(null);
  const { getEdges, getNodes, setNodes, setEdges, fitView } = useReactFlow();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [dialogSize, setDialogSize] = useState({ width: 800, height: 600 });
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
  const [previousState, setPreviousState] = useState<{ size: typeof dialogSize; position: typeof dialogPosition } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);

  // Initialize dialog position to center of screen when opened
  const initializePosition = useCallback(() => {
    if (typeof window === 'undefined') return;
    setDialogPosition({
      x: (window.innerWidth - dialogSize.width) / 2,
      y: (window.innerHeight - dialogSize.height) / 2
    });
  }, [dialogSize]);

  // Toggle maximize state
  const toggleMaximize = useCallback(() => {
    if (isMaximized) {
      // Restore previous size and position
      if (previousState) {
        setDialogSize(previousState.size);
        setDialogPosition(previousState.position);
      }
    } else {
      // Save current state and maximize
      setPreviousState({ size: dialogSize, position: dialogPosition });
      setDialogSize({ width: window.innerWidth - 40, height: window.innerHeight - 40 });
      setDialogPosition({ x: 20, y: 20 });
    }
    setIsMaximized(!isMaximized);
  }, [isMaximized, dialogSize, dialogPosition, previousState]);

  // Start drag
  const startDrag = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    e.preventDefault();
    const dialog = dialogRef.current;
    if (!dialog) return;

    const rect = dialog.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: rect.left,
      startTop: rect.top
    };

    const handleDrag = (e: MouseEvent) => {
      if (!dragRef.current) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      setDialogPosition({
        x: Math.max(0, dragRef.current.startLeft + deltaX),
        y: Math.max(0, dragRef.current.startTop + deltaY)
      });
    };

    const stopDrag = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
  }, [isMaximized]);

  // Start resize
  const startResize = useCallback((e: React.MouseEvent, direction: 'right' | 'bottom' | 'corner') => {
    if (isMaximized) return;
    e.preventDefault();
    const dialog = dialogRef.current;
    if (!dialog) return;

    const rect = dialog.getBoundingClientRect();
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height
    };

    const handleResize = (e: MouseEvent) => {
      if (!resizeRef.current) return;

      let newWidth = dialogSize.width;
      let newHeight = dialogSize.height;

      if (direction === 'right' || direction === 'corner') {
        newWidth = Math.max(400, resizeRef.current.startWidth + (e.clientX - resizeRef.current.startX));
      }
      if (direction === 'bottom' || direction === 'corner') {
        newHeight = Math.max(300, resizeRef.current.startHeight + (e.clientY - resizeRef.current.startY));
      }

      setDialogSize({ width: newWidth, height: newHeight });
    };

    const stopResize = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    };

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  }, [dialogSize, isMaximized]);

  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) {
      onHighlight(null);
      setSearchResults(null);
      return;
    }

    const edges = getEdges();
    const nodes = getNodes();
    
    // Find edges that match the search term at any level
    const matchingEdges = edges.filter((edge: Edge) => {
      if (!edge.data?.apiCalls) return false;
      
      return edge.data.apiCalls.some(call => {
        const matchesPath = call.path.toLowerCase().includes(searchTerm.toLowerCase());
        const hasMatchingNestedCalls = (call.calls || []).some(nestedCall => 
          nestedCall.path.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return matchesPath || hasMatchingNestedCalls;
      });
    });

    // Find complete routes through the matching edges
    const routes = findRoutes(matchingEdges, nodes);

    // Build API call trees for the routes
    const apiCallTrees = buildApiCallTree(edges, searchTerm);

    if (apiCallTrees.length === 0) {
      onHighlight(null);
      setSearchResults({ 
        count: 0, 
        message: 'No matches found',
        routes: []
      });
    } else {
      setSearchResults({ 
        count: apiCallTrees.length, 
        message: `Found ${apiCallTrees.length} matching route${apiCallTrees.length === 1 ? '' : 's'}`,
        routes: [{ path: ['Client'], edges: matchingEdges, apiCalls: apiCallTrees }]
      });

      // Highlight matching edges
      edges.forEach(edge => {
        const isMatch = matchingEdges.some(match => match.id === edge.id);
        if (isMatch) {
          onHighlight(edge.id);
        }
      });
    }
  }, [searchTerm, getEdges, getNodes, onHighlight]);

  const handleReset = () => {
    setNodes(nodes => 
      nodes.map(node => ({
        ...node,
        hidden: false
      }))
    );
    
    setEdges(edges => 
      edges.map(edge => ({
        ...edge,
        hidden: false,
        data: {
          ...edge.data,
          apiCalls: edge.data.originalApiCalls || edge.data.apiCalls
        }
      }))
    );

    onHighlight(null);
    setTimeout(() => fitView({ duration: 800 }), 50);
  };

  const handleClose = () => {
    setOpen(false);
    setSearchResults(null);
    setSearchTerm('');
    handleReset();
  };

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          initializePosition();
        }}
        className={className}
        title="Search API Paths"
      >
        <Search className="w-4 h-4" />
      </button>

      <Dialog.Root open={open} onOpenChange={handleClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content 
            ref={dialogRef}
            className="fixed bg-white rounded-lg shadow-lg overflow-hidden"
            style={{
              left: dialogPosition.x,
              top: dialogPosition.y,
              width: dialogSize.width,
              height: dialogSize.height
            }}
          >
            <Dialog.Title 
              className="text-lg font-semibold px-6 py-4 border-b border-gray-200 flex items-center justify-between cursor-move"
              onMouseDown={startDrag}
            >
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-500" />
                <span>Search API Paths</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMaximize}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  {isMaximized ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
                <Dialog.Close className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>
            </Dialog.Title>
            
            <div className="p-6 space-y-4 overflow-auto" style={{ height: 'calc(100% - 60px)' }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter path to search..."
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Search
                </button>
              </div>

              {searchResults && (
                <div className="space-y-4">
                  <div className={clsx(
                    "p-3 rounded-md",
                    searchResults.count > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}>
                    {searchResults.message}
                  </div>

                  {searchResults.routes.length > 0 && searchResults.routes[0].apiCalls && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">Matching Routes</h3>
                        <button
                          onClick={handleReset}
                          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Reset View
                        </button>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                        <TreeView apiCalls={searchResults.routes[0].apiCalls} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Resize handles (only shown when not maximized) */}
            {!isMaximized && (
              <>
                <div 
                  className="absolute inset-y-0 right-0 w-1 cursor-ew-resize hover:bg-blue-500/20"
                  onMouseDown={(e) => startResize(e, 'right')}
                />
                <div 
                  className="absolute inset-x-0 bottom-0 h-1 cursor-ns-resize hover:bg-blue-500/20"
                  onMouseDown={(e) => startResize(e, 'bottom')}
                />
                <div 
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-gray-400 hover:text-gray-600"
                  onMouseDown={(e) => startResize(e, 'corner')}
                >
                  <GripVertical className="w-4 h-4 transform rotate-45" />
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}