import { ApiCall, ApiCallGroup } from './types';

export function groupApiCalls(apiCalls: ApiCall[]): ApiCallGroup[] {
  const groups = new Map<string, ApiCallGroup>();

  apiCalls.forEach(call => {
    const key = JSON.stringify({
      method: call.method,
      path: call.path,
      controller: call.controller,
      operation: call.operation
    });

    const existing = groups.get(key);
    if (existing) {
      existing.count++;
      // Merge nested calls if they exist
      if (call.calls) {
        existing.calls = [...(existing.calls || []), ...call.calls];
      }
    } else {
      groups.set(key, { 
        ...call, 
        count: 1,
        childCallCount: countNestedCalls(call.calls),
        // Preserve the original nested calls structure
        calls: call.calls || []
      });
    }
  });

  return Array.from(groups.values());
}

function countNestedCalls(calls?: ApiCall[]): number {
  if (!calls) return 0;
  return calls.reduce((sum, call) => {
    return sum + 1 + countNestedCalls(call.calls);
  }, 0);
}

// Keep track of all routes globally
let allRoutes: ApiCall[] = [];

export function setAllRoutes(routes: ApiCall[]) {
  allRoutes = routes.map(route => ({
    ...route,
    // Ensure nested calls are preserved when setting routes
    calls: route.calls || []
  }));
}

export function findTraces(targetPath: string): ApiCallGroup[] {
  // Find all routes that include this path as part of their journey
  const traces = allRoutes.filter(route => {
    // Check if this route is part of a path that leads to the target
    return route.path === targetPath || 
           hasPathInCallTree(route.calls, targetPath);
  });

  // Group the traces by their unique paths
  return groupApiCalls(traces);
}

function hasPathInCallTree(calls: ApiCall[] | undefined, targetPath: string): boolean {
  if (!calls) return false;
  
  return calls.some(call => 
    call.path === targetPath || 
    hasPathInCallTree(call.calls, targetPath)
  );
}