import { Route } from '../types/routes';

export function parseRoutes(input: string): Route[] {
  const routes: Route[] = [];
  
  try {
    // Try to parse as JSON first
    const data = JSON.parse(input);
    
    // Handle array of route objects
    if (Array.isArray(data)) {
      return data.map(route => processRoute(route));
    }
    
    // Handle single route object
    if (data.service && data.path) {
      return [processRoute(data)];
    }
  } catch {
    // If JSON parsing fails, fall back to text parsing
    const lines = input.split('\n');
    return parseTextRoutes(lines);
  }
  
  return routes;
}

function processRoute(route: any): Route {
  return {
    ...route,
    // Process each call in the calls array recursively
    calls: processNestedCalls(route.calls)
  };
}

function processNestedCalls(calls: any[] | undefined): any[] {
  if (!calls) return [];
  
  return calls.map(call => {
    // Create base call object
    const processedCall = {
      method: call.method,
      path: call.path,
      controller: call.controller,
      operation: call.operation,
      description: call.description,
      controllerFilePath: call.controllerFilePath,
      // Handle both service and client fields
      service: call.service || call.client,
      // Recursively process nested calls
      calls: processNestedCalls(call.calls)
    };

    // If this is a client call, add the client field
    if (call.client) {
      processedCall.client = call.client;
    }

    return processedCall;
  });
}

function parseTextRoutes(lines: string[]): Route[] {
  const routes: Route[] = [];
  
  for (const line of lines) {
    if (line.includes('->')) {
      const [source, rest] = line.split('->').map(s => s.trim());
      const [target, pathPart] = rest.split(':').map(s => s.trim());
      
      if (pathPart) {
        // Extract controller and operation if present in parentheses
        const descMatch = /\((.*?)\)/.exec(pathPart);
        const description = descMatch ? descMatch[1] : '';
        
        // Remove the description part for parsing method and path
        const cleanPathPart = pathPart.replace(/\s*\(.*?\)\s*$/, '');
        
        // Parse controller/operation format
        const controllerMatch = /(\w+)\/(\w+)/.exec(cleanPathPart);
        let method = '', path = cleanPathPart;
        
        if (controllerMatch) {
          method = 'POST'; // Default method for controller operations
          path = cleanPathPart;
        } else {
          const parts = cleanPathPart.split(' ');
          method = parts[0];
          path = parts.slice(1).join(' ');
        }

        routes.push({
          source,
          target,
          method,
          path,
          description,
          controller: controllerMatch ? controllerMatch[1] : undefined,
          operation: controllerMatch ? controllerMatch[2] : undefined,
          calls: [] // Initialize empty calls array
        });
      }
    }
  }
  
  return routes;
}