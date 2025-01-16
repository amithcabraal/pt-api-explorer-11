export interface Node {
  id: string;
  type: 'service';
  position: { x: number; y: number };
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
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  data: {
    description: string;
    method: string;
    path: string;
  };
}