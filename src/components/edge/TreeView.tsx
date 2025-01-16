import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import type { ApiCall } from './types';

interface TreeViewProps {
  apiCalls: ApiCall[];
  onShowTrace?: (path: string) => void;
}

interface TreeNodeProps {
  call: ApiCall;
  parentService?: string;
  depth?: number;
  isLast?: boolean;
  onShowTrace?: (path: string) => void;
}

function TreeNode({ call, parentService, depth = 0, isLast = false, onShowTrace }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed
  const hasChildren = call.calls && call.calls.length > 0;

  const handleShowTrace = () => {
    if (onShowTrace) {
      onShowTrace(call.path);
    }
  };

  // Create a unique key for this node based on its properties
  const nodeKey = `${call.method}-${call.path}-${call.service || call.client}`;

  return (
    <div className="relative">
      <div className="flex items-start gap-2 group">
        {/* Indentation and tree lines */}
        {depth > 0 && (
          <div className="absolute left-0 top-0 bottom-0">
            <div 
              className={clsx(
                "absolute left-0 w-px bg-gray-200",
                isLast ? "h-4" : "h-full"
              )}
              style={{ left: `${(depth - 1) * 24}px` }}
            />
            <div 
              className="absolute w-5 h-px bg-gray-200" 
              style={{ left: `${(depth - 1) * 24}px`, top: "16px" }}
            />
          </div>
        )}

        {/* Node content with Windows Explorer-like styling */}
        <div 
          className={clsx(
            "flex items-center min-w-0 rounded-md transition-colors",
            "hover:bg-blue-50 group-hover:bg-blue-50/50",
            "cursor-pointer select-none"
          )}
          style={{ marginLeft: `${depth * 24}px` }}
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        >
          {/* Expand/Collapse and folder icons */}
          <div className="flex items-center">
            {hasChildren ? (
              <>
                <div className="p-1">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div className="p-1">
                  {isExpanded ? (
                    <FolderOpen className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Folder className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-6" /> {/* Spacing for alignment */}
                <div className="p-1">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
              </>
            )}
          </div>

          {/* Node details */}
          <div className="flex-1 min-w-0 py-1 pr-4">
            {/* Service path and method */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-900 font-medium">
                {depth === 0 ? (
                  <span>Client → {call.service}</span>
                ) : (
                  <span>{parentService} → {call.service || call.client}</span>
                )}
              </span>
              <span className={clsx(
                "px-2 py-0.5 text-xs font-medium rounded",
                call.method === 'GET' && "bg-blue-100 text-blue-700",
                call.method === 'POST' && "bg-green-100 text-green-700",
                call.method === 'PUT' && "bg-orange-100 text-orange-700",
                call.method === 'DELETE' && "bg-red-100 text-red-700"
              )}>
                {call.method}
              </span>
              <span className="font-mono text-gray-600 truncate">
                {call.path}
              </span>
            </div>

            {/* Controller and file path */}
            {(call.controller || call.controllerFilePath) && (
              <div className="mt-1 space-y-1">
                {call.controller && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Controller:</span> {call.controller}
                    {call.operation && `/${call.operation}`}
                  </div>
                )}
                {call.controllerFilePath && (
                  <div className="text-xs font-mono text-gray-500 truncate">
                    <span className="font-sans font-medium">Code:</span> {call.controllerFilePath}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Child nodes */}
      {isExpanded && hasChildren && (
        <div className="mt-2">
          {/* Filter out duplicate child calls based on method, path, and service */}
          {Array.from(
            new Map(
              call.calls!.map(childCall => [
                `${childCall.method}-${childCall.path}-${childCall.service || childCall.client}`,
                childCall
              ])
            ).values()
          ).map((childCall, idx, filteredArray) => (
            <TreeNode
              key={`${nodeKey}-child-${idx}`}
              call={childCall}
              parentService={call.service}
              depth={depth + 1}
              isLast={idx === filteredArray.length - 1}
              onShowTrace={onShowTrace}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TreeView({ apiCalls, onShowTrace }: TreeViewProps) {
  // Filter out duplicate top-level calls
  const uniqueApiCalls = Array.from(
    new Map(
      apiCalls.map(call => [
        `${call.method}-${call.path}-${call.service || call.client}`,
        call
      ])
    ).values()
  );

  return (
    <div className="space-y-4 bg-white rounded-lg p-4">
      {uniqueApiCalls.map((call, idx) => (
        <TreeNode
          key={`root-${idx}`}
          call={call}
          isLast={idx === uniqueApiCalls.length - 1}
          onShowTrace={onShowTrace}
        />
      ))}
    </div>
  );
}