import { downloadSvg } from './svg';
import type { ExportOptions } from './types';

export async function downloadImage(options: ExportOptions) {
  try {
    const flowContainer = document.querySelector('.react-flow') as HTMLElement;
    if (!flowContainer) return;

    // Clone the flow container for SVG export
    const clone = flowContainer.cloneNode(true) as HTMLElement;
    
    // Remove any temporary or unnecessary elements
    clone.querySelectorAll('.react-flow__handle,.react-flow__edge-path').forEach(el => {
      el.removeAttribute('style');
    });

    // Convert to SVG and download
    const fileName = `flow-diagram-${new Date().toISOString().split('T')[0]}`;
    downloadSvg(clone, fileName);
  } catch (error) {
    console.error('Error generating SVG:', error);
  }
}