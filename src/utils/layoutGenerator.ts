import { Route } from '../types/routes';
import { Node, Edge } from '../types/graph';

function getServiceColor(service: string): string {
  const colors: Record<string, string> = {
    'Client': 'bg-purple-100 border-purple-400',
    'Api Gateway': 'bg-green-100 border-green-400',
    'ApiGateway': 'bg-green-100 border-green-400',
    'AccountsApi': 'bg-purple-100 border-purple-400',
    'AddressLookup': 'bg-yellow-100 border-yellow-400',
    'ScientificGamesPlayer': 'bg-red-100 border-red-400',
    'ScientificGamesService': 'bg-indigo-100 border-indigo-400',
    'ScientificGamesPlayerClient': 'bg-red-100 border-red-400',
    'ScientificGamesServiceClient': 'bg-indigo-100 border-indigo-400',
    'ExperianRest': 'bg-pink-100 border-pink-400',
    'SalesforceRest': 'bg-orange-100 border-orange-400'
  };
  return colors[service] || 'bg-gray-100 border-gray-400';
}

function processNestedCalls(
  calls: any[] | undefined,
  parentService: string,
  edgeMap: Map<string, any[]>,
  services: Set<string>
) {
  if (!calls) return;

  calls.forEach(call => {
    // Handle both service and client fields
    const targetService = call.service || call.client;
    if (!targetService) return;

    // Add the service to our set
    services.add(targetService);

    // Create edge key from source to target
    const key = `${parentService}->${targetService}`;
    const existing = edgeMap.get(key) || [];
    
    // Add this call to the edge data
    edgeMap.set(key, [...existing, {
      ...call,
      source: parentService,
      target: targetService
    }]);

    // Process nested calls recursively, using the current service as parent
    if (call.calls && call.calls.length > 0) {
      processNestedCalls(call.calls, targetService, edgeMap, services);
    }
  });
}

export function createNodesAndEdges(routes: Route[]): { nodes: Node[]; edges: Edge[] } {
  const services = new Set<string>();
  const edgeMap = new Map<string, any[]>();
  
  // Always add Client as the first service
  services.add('Client');
  
  // Process all routes and their nested calls
  routes.forEach(route => {
    // Add the main service
    services.add(route.service);
    
    // Add first-level connection from Client to service
    const clientKey = `Client->${route.service}`;
    const existing = edgeMap.get(clientKey) || [];
    edgeMap.set(clientKey, [...existing, {
      ...route,
      source: 'Client',
      target: route.service
    }]);

    // Process nested calls recursively starting from the main service
    if (route.calls && route.calls.length > 0) {
      processNestedCalls(route.calls, route.service, edgeMap, services);
    }
  });

  // Create nodes in a circular layout
  const serviceArray = Array.from(services);
  const radius = Math.max(serviceArray.length * 100, 300);
  const angleStep = (2 * Math.PI) / (serviceArray.length - 1); // -1 because Client will be in center

  const nodes: Node[] = serviceArray.map((service, i) => {
    if (service === 'Client') {
      // Place Client node in the center
      return {
        id: service,
        type: 'service',
        position: { x: 400, y: 300 },
        data: { 
          label: service,
          className: getServiceColor(service)
        }
      };
    }
    
    // Place other services in a circle around the Client
    const idx = i - 1; // Adjust index since Client is handled separately
    return {
      id: service,
      type: 'service',
      position: {
        x: 400 + radius * Math.cos(idx * angleStep),
        y: 300 + radius * Math.sin(idx * angleStep)
      },
      data: { 
        label: service,
        className: getServiceColor(service)
      }
    };
  });

  // Create edges for all service connections
  const edges: Edge[] = Array.from(edgeMap.entries()).map(([key, calls], i) => {
    const [source, target] = key.split('->');
    return {
      id: `edge-${i}`,
      source: source,
      target: target,
      data: {
        apiCalls: calls.map(call => ({
          description: call.description,
          method: call.method,
          path: call.path,
          controller: call.controller,
          operation: call.operation,
          controllerFilePath: call.controllerFilePath,
          calls: call.calls,
          service: call.service || call.client
        }))
      }
    };
  });

  return { nodes, edges };
}