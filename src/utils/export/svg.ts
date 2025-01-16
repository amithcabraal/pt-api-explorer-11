import { Node, Edge } from 'reactflow';

export function downloadSvg(container: HTMLElement, fileName: string) {
  // Get the viewport and its transformation
  const viewport = container.querySelector('.react-flow__viewport') as HTMLElement;
  if (!viewport) return;

  // Parse transform matrix
  const transform = viewport.style.transform;
  const [translateX, translateY, scale] = parseTransform(transform);

  // Get all nodes and edges for bounds calculation
  const nodes = Array.from(container.querySelectorAll('.react-flow__node'));
  const edges = Array.from(container.querySelectorAll('.react-flow__edge'));

  // Calculate bounds
  const bounds = calculateBounds(nodes);
  if (!bounds) return;

  // Add padding
  const padding = 50;
  const width = bounds.width + padding * 2;
  const height = bounds.height + padding * 2;

  // Create SVG content
  const svgContent = `
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="${width}" 
      height="${height}" 
      viewBox="${bounds.x - padding} ${bounds.y - padding} ${width} ${height}"
    >
      <defs>
        <style>
          .react-flow__node {
            fill: white;
            stroke: #ccc;
            stroke-width: 1;
          }
          .react-flow__node-service {
            fill: white;
            stroke: #e2e8f0;
            stroke-width: 2;
          }
          .react-flow__edge-path {
            stroke: #64748b;
            stroke-width: 2;
            fill: none;
          }
          .react-flow__edge.selected .react-flow__edge-path {
            stroke: #6366f1;
          }
          text {
            font-family: ui-sans-serif, system-ui, sans-serif;
            font-size: 14px;
            fill: #1e293b;
          }
          .node-icon {
            color: #0ea5e9;
          }
        </style>
      </defs>
      
      <g transform="translate(${translateX}, ${translateY}) scale(${scale})">
        ${serializeEdges(edges)}
        ${serializeNodes(nodes)}
      </g>
    </svg>
  `;

  // Download the SVG
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseTransform(transform: string) {
  const translateMatch = transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/);
  const scaleMatch = transform.match(/scale\(([-\d.]+)\)/);
  
  return [
    translateMatch ? parseFloat(translateMatch[1]) : 0,
    translateMatch ? parseFloat(translateMatch[2]) : 0,
    scaleMatch ? parseFloat(scaleMatch[1]) : 1
  ];
}

function calculateBounds(nodes: Element[]) {
  if (nodes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach(node => {
    const rect = node.getBoundingClientRect();
    minX = Math.min(minX, rect.left);
    minY = Math.min(minY, rect.top);
    maxX = Math.max(maxX, rect.right);
    maxY = Math.max(maxY, rect.bottom);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function serializeNodes(nodes: Element[]): string {
  return nodes.map(node => {
    const rect = node.getBoundingClientRect();
    const label = node.querySelector('.text-sm')?.textContent || '';
    const icon = node.querySelector('svg');
    
    return `
      <g class="react-flow__node react-flow__node-service" transform="translate(${rect.left}, ${rect.top})">
        <rect 
          width="${rect.width}" 
          height="${rect.height}" 
          rx="6"
        />
        <g transform="translate(16, ${rect.height/2})" class="node-content">
          ${icon ? serializeIcon(icon) : ''}
          <text x="28" y="0" dominant-baseline="middle">${label}</text>
        </g>
      </g>
    `;
  }).join('');
}

function serializeIcon(icon: Element): string {
  // Simplify the server icon to basic SVG paths
  return `
    <svg class="node-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
      <line x1="6" y1="6" x2="6" y2="6"></line>
      <line x1="6" y1="18" x2="6" y2="18"></line>
    </svg>
  `;
}

function serializeEdges(edges: Element[]): string {
  return edges.map(edge => {
    const path = edge.querySelector('.react-flow__edge-path');
    const d = path?.getAttribute('d') || '';
    const isSelected = edge.classList.contains('selected');
    
    return `
      <path 
        class="react-flow__edge-path"
        d="${d}"
        ${isSelected ? 'stroke="#6366f1"' : ''}
      />
    `;
  }).join('');
}