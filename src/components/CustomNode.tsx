import { memo, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { Server } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { NodeContextMenu } from './NodeContextMenu';

interface CustomNodeProps {
  data: { 
    label: string;
    className?: string;
    hyperlink?: string;
    color?: {
      background: string;
      border: string;
      text: string;
    };
  };
  id: string;
}

const CustomNode = memo(({ data, id }: CustomNodeProps) => {
  const handleIconClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.hyperlink) {
      window.open(data.hyperlink, '_blank', 'noopener,noreferrer');
    }
  }, [data.hyperlink]);

  // Use custom colors if provided, otherwise use the className
  const nodeStyle = data.color ? {
    backgroundColor: data.color.background,
    borderColor: data.color.border,
    color: data.color.text
  } : undefined;

  return (
    <NodeContextMenu nodeId={id}>
      <div 
        className={`px-4 py-2 shadow-md rounded-md border-2 ${data.className || 'bg-white border-stone-400'}`}
        style={nodeStyle}
      >
        <Handle type="target" position={Position.Top} className="w-16 !bg-teal-500" />
        <div className="flex items-center">
          <button 
            onClick={handleIconClick}
            className={`mr-2 p-1 rounded-md transition-colors ${
              data.hyperlink 
                ? 'hover:bg-black/5 cursor-pointer' 
                : 'cursor-default'
            }`}
            title={data.hyperlink ? "Click to open link" : undefined}
          >
            <Server className="h-5 w-5 text-teal-600" />
          </button>
          <div className="text-sm font-bold">{data.label}</div>
        </div>
        <Handle type="source" position={Position.Bottom} className="w-16 !bg-teal-500" />
      </div>
    </NodeContextMenu>
  );
});

export default CustomNode;