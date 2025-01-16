import { useState, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, GripVertical, GripHorizontal, GitFork } from 'lucide-react';
import { ApiCallGroup, ApiCall } from './types';
import { TreeView } from './TreeView';
import { RouteTraceDialog } from './RouteTraceDialog';
import { findTraces } from './utils';

interface EdgeTooltipProps {
  apiCalls: ApiCallGroup[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: { x: number; y: number };
  source: string;
  target: string;
}

function buildApiCallTree(call: ApiCallGroup): ApiCall {
  const apiCall: ApiCall = {
    method: call.method,
    path: call.path,
    service: call.service,
    controller: call.controller,
    operation: call.operation,
    controllerFilePath: call.controllerFilePath,
    calls: []
  };

  // Process nested calls recursively
  if (call.calls && call.calls.length > 0) {
    apiCall.calls = call.calls.map(childCall => buildApiCallTree({
      ...childCall,
      count: 1, // ApiCallGroup requires count property
      service: childCall.service || childCall.client
    }));
  }

  return apiCall;
}

function calculateCallBreakdown(apiCalls: ApiCallGroup[]) {
  let directCalls = 0;
  let nestedCalls = 0;

  apiCalls.forEach(call => {
    // Count direct calls (including duplicates)
    directCalls += call.count;

    // Count nested calls recursively
    const countNested = (calls?: ApiCall[]): number => {
      if (!calls) return 0;
      return calls.reduce((sum, nestedCall) => {
        return sum + 1 + countNested(nestedCall.calls);
      }, 0);
    };

    nestedCalls += countNested(call.calls);
  });

  return {
    directCalls,
    nestedCalls,
    total: directCalls + nestedCalls
  };
}

export function EdgeTooltip({ apiCalls, open, onOpenChange, position, source, target }: EdgeTooltipProps) {
  const [traceDialogOpen, setTraceDialogOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [traces, setTraces] = useState<ApiCallGroup[]>([]);
  const [dialogSize, setDialogSize] = useState({ width: 500, height: 'auto' });
  const [dialogPosition, setDialogPosition] = useState({ x: position.x, y: position.y });
  const dialogRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);

  // Transform ApiCallGroup[] into properly nested ApiCall[]
  const transformedApiCalls = apiCalls.map(call => buildApiCallTree(call));

  // Calculate call breakdown
  const breakdown = calculateCallBreakdown(apiCalls);

  const handleShowTrace = (path: string) => {
    const pathTraces = findTraces(path);
    setTraces(pathTraces);
    setSelectedPath(path);
    setTraceDialogOpen(true);
  };

  // Update position when the position prop changes
  useEffect(() => {
    setDialogPosition(position);
  }, [position]);

  // Resize handlers
  const startResize = (e: React.MouseEvent, direction: 'left' | 'right' | 'top' | 'bottom' | 'bottom-right') => {
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

      let newWidth = resizeRef.current.startWidth;
      let newHeight = resizeRef.current.startHeight;
      let newX = dialogPosition.x;

      switch (direction) {
        case 'left':
          const deltaX = e.clientX - resizeRef.current.startX;
          newWidth = Math.max(300, resizeRef.current.startWidth - deltaX);
          newX = dialogPosition.x + (resizeRef.current.startWidth - newWidth);
          break;
        case 'right':
          newWidth = Math.max(300, resizeRef.current.startWidth + (e.clientX - resizeRef.current.startX));
          break;
        case 'top':
          const deltaY = e.clientY - resizeRef.current.startY;
          newHeight = Math.max(200, resizeRef.current.startHeight - deltaY);
          break;
        case 'bottom':
        case 'bottom-right':
          newWidth = direction === 'bottom-right' 
            ? Math.max(300, resizeRef.current.startWidth + (e.clientX - resizeRef.current.startX))
            : resizeRef.current.startWidth;
          newHeight = Math.max(200, resizeRef.current.startHeight + (e.clientY - resizeRef.current.startY));
          break;
      }

      setDialogSize({ width: newWidth, height: newHeight });
      if (direction === 'left') {
        setDialogPosition(prev => ({ ...prev, x: newX }));
      }
    };

    const stopResize = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    };

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  };

  // Drag handlers
  const startDrag = (e: React.MouseEvent) => {
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
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content 
            ref={dialogRef}
            className="fixed bg-white rounded-lg shadow-lg overflow-hidden"
            style={{
              left: dialogPosition.x,
              top: dialogPosition.y,
              width: dialogSize.width,
              height: dialogSize.height !== 'auto' ? dialogSize.height : undefined,
              minWidth: '500px',
              minHeight: '300px',
              maxHeight: '80vh' // Limit maximum height to 80% of viewport height
            }}
          >
            <Dialog.Title asChild>
              <div 
                className="bg-gray-100 px-4 py-2 cursor-move flex items-center justify-between border-b border-gray-200"
                onMouseDown={startDrag}
              >
                <div className="flex items-center gap-2 text-gray-700">
                  <GripHorizontal className="w-4 h-4" />
                  <span className="font-medium">Route Details: {source} → {target}</span>
                </div>
                <Dialog.Close className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>
            </Dialog.Title>

            <div className="flex flex-col h-[calc(100%-40px)]">
              {/* Call Breakdown - Fixed at top */}
              <div className="flex-none p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <GitFork className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium text-gray-900">API Call Breakdown</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-md border border-gray-200">
                    <div className="text-sm text-gray-600">Direct Calls</div>
                    <div className="text-2xl font-semibold text-blue-600">{breakdown.directCalls}</div>
                  </div>
                  <div className="bg-white p-3 rounded-md border border-gray-200">
                    <div className="text-sm text-gray-600">Nested Calls</div>
                    <div className="text-2xl font-semibold text-green-600">{breakdown.nestedCalls}</div>
                  </div>
                  <div className="bg-white p-3 rounded-md border border-gray-200">
                    <div className="text-sm text-gray-600">Total Calls</div>
                    <div className="text-2xl font-semibold text-purple-600">{breakdown.total}</div>
                  </div>
                </div>
              </div>

              {/* Tree View - Scrollable */}
              <div className="flex-1 p-4 overflow-auto">
                <TreeView apiCalls={transformedApiCalls} onShowTrace={handleShowTrace} />
              </div>
            </div>

            {/* Resize handles */}
            <div 
              className="absolute inset-y-0 left-0 w-1 cursor-ew-resize hover:bg-blue-500/20"
              onMouseDown={(e) => startResize(e, 'left')}
            />
            <div 
              className="absolute inset-y-0 right-0 w-1 cursor-ew-resize hover:bg-blue-500/20"
              onMouseDown={(e) => startResize(e, 'right')}
            />
            <div 
              className="absolute inset-x-0 top-0 h-1 cursor-ns-resize hover:bg-blue-500/20"
              onMouseDown={(e) => startResize(e, 'top')}
            />
            <div 
              className="absolute inset-x-0 bottom-0 h-1 cursor-ns-resize hover:bg-blue-500/20"
              onMouseDown={(e) => startResize(e, 'bottom')}
            />
            <div 
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-gray-400 hover:text-gray-600"
              onMouseDown={(e) => startResize(e, 'bottom-right')}
            >
              <GripVertical className="w-4 h-4 transform rotate-45" />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <RouteTraceDialog
        open={traceDialogOpen}
        onOpenChange={setTraceDialogOpen}
        path={selectedPath}
        traces={traces}
      />
    </>
  );
}