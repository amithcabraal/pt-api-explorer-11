import { FileJson, GitFork } from 'lucide-react';
import { ApiCallGroup } from './types';
import { clsx } from 'clsx';

interface ApiCallDetailsProps {
  call: ApiCallGroup;
  onShowTrace?: (path: string) => void;
}

export function ApiCallDetails({ call, onShowTrace }: ApiCallDetailsProps) {
  // Calculate total child calls recursively
  const countChildCalls = (calls?: ApiCallGroup['calls']): number => {
    if (!calls) return 0;
    return calls.reduce((sum, call) => {
      return sum + 1 + countChildCalls(call.calls);
    }, 0);
  };

  const childCallCount = countChildCalls(call.calls);

  return (
    <div className="space-y-4">
      {/* Main Call Details */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={clsx(
                "px-2 py-1 text-xs font-medium rounded",
                call.method === 'GET' && "bg-blue-100 text-blue-700",
                call.method === 'POST' && "bg-green-100 text-green-700",
                call.method === 'PUT' && "bg-orange-100 text-orange-700",
                call.method === 'DELETE' && "bg-red-100 text-red-700"
              )}>
                {call.method}
              </span>
              <span className="font-medium text-gray-900">{call.path}</span>
            </div>

            {call.controllerFilePath && (
              <div className="mt-2 text-sm text-gray-500 font-mono">
                {call.controllerFilePath}
              </div>
            )}

            {call.controller && (
              <div className="mt-2 text-sm text-gray-600">
                Controller: {call.controller}
                {call.operation && ` / ${call.operation}`}
              </div>
            )}

            {childCallCount > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <GitFork className="w-4 h-4" />
                Triggers {childCallCount} downstream call{childCallCount === 1 ? '' : 's'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Child Calls */}
      {call.calls && call.calls.length > 0 && (
        <div className="pl-6 border-l-2 border-gray-200 space-y-4">
          {call.calls.map((childCall, index) => (
            <ApiCallDetails
              key={index}
              call={childCall as ApiCallGroup}
              onShowTrace={onShowTrace}
            />
          ))}
        </div>
      )}
    </div>
  );
}