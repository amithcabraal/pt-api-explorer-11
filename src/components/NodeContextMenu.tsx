import { useState, useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { clsx } from 'clsx';

const colorSchemes = [
  {
    name: 'Default',
    background: 'rgb(243 244 246)',
    border: 'rgb(156 163 175)',
    text: 'rgb(17 24 39)'
  },
  {
    name: 'Blue',
    background: 'rgb(219 234 254)',
    border: 'rgb(96 165 250)',
    text: 'rgb(29 78 216)'
  },
  {
    name: 'Green',
    background: 'rgb(220 252 231)',
    border: 'rgb(74 222 128)',
    text: 'rgb(21 128 61)'
  },
  {
    name: 'Purple',
    background: 'rgb(237 233 254)',
    border: 'rgb(167 139 250)',
    text: 'rgb(109 40 217)'
  },
  {
    name: 'Orange',
    background: 'rgb(254 235 220)',
    border: 'rgb(251 146 60)',
    text: 'rgb(194 65 12)'
  },
  {
    name: 'Red',
    background: 'rgb(254 226 226)',
    border: 'rgb(248 113 113)',
    text: 'rgb(185 28 28)'
  }
];

interface NodeContextMenuProps {
  children: React.ReactNode;
  nodeId: string;
}

export function NodeContextMenu({ children, nodeId }: NodeContextMenuProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const { getNode, setNodes } = useReactFlow();

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const updateNodeColor = useCallback((color: typeof colorSchemes[0]) => {
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              color: {
                background: color.background,
                border: color.border,
                text: color.text
              }
            }
          };
        }
        return node;
      })
    );
    closeContextMenu();
  }, [nodeId, setNodes, closeContextMenu]);

  const updateHyperlink = useCallback(() => {
    const node = getNode(nodeId);
    const currentLink = node?.data?.hyperlink || '';
    const newLink = window.prompt('Enter hyperlink URL:', currentLink);
    
    if (newLink !== null) {
      setNodes(nodes => 
        nodes.map(node => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                hyperlink: newLink
              }
            };
          }
          return node;
        })
      );
    }
    closeContextMenu();
  }, [nodeId, getNode, setNodes, closeContextMenu]);

  return (
    <div onContextMenu={handleContextMenu}>
      {children}
      
      {contextMenu && (
        <>
          <div 
            className="fixed inset-0" 
            onClick={closeContextMenu}
          />
          <div 
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-48"
            style={{ 
              left: contextMenu.x, 
              top: contextMenu.y,
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            <div className="px-3 py-1 text-sm font-medium text-gray-500">Color Scheme</div>
            {colorSchemes.map((color, index) => (
              <button
                key={index}
                className={clsx(
                  "w-full px-3 py-1 text-left text-sm hover:bg-gray-100 flex items-center gap-2",
                  "transition-colors"
                )}
                onClick={() => updateNodeColor(color)}
              >
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ 
                    backgroundColor: color.background,
                    borderColor: color.border
                  }} 
                />
                <span style={{ color: color.text }}>{color.name}</span>
              </button>
            ))}
            
            <div className="my-1 border-t border-gray-200" />
            
            <button
              className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100"
              onClick={updateHyperlink}
            >
              Set Hyperlink
            </button>
          </div>
        </>
      )}
    </div>
  );
}