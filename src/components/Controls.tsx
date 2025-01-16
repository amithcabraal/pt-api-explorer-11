import { memo } from 'react';
import { useReactFlow, Controls as ReactFlowControls } from 'reactflow';
import { Save, RotateCcw } from 'lucide-react';
import { SearchDialog } from './SearchDialog';
import { DataSourceInput } from './DataSourceInput';
import { downloadFlowData } from '../utils/storage';

interface ControlsProps {
  onDataLoad?: (data: string, layout?: { nodes: any[]; edges: any[] }) => void;
  showUploadDialog?: boolean;
  routesData?: string;
  onReset?: () => void;
}

const Controls = memo(({ onDataLoad, showUploadDialog, routesData, onReset }: ControlsProps) => {
  const { getNodes, getEdges, setEdges } = useReactFlow();

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (routesData) {
      downloadFlowData(routesData, getNodes(), getEdges());
    }
  };

  const handleHighlight = (edgeId: string | null) => {
    setEdges((edges) =>
      edges.map((edge) => ({
        ...edge,
        selected: edgeId ? edge.id === edgeId : false,
      }))
    );
  };

  return (
    <>
      <ReactFlowControls showInteractive={true}>
        <button
          onClick={handleSave}
          className="react-flow__controls-button"
          title="Save Flow Data"
          disabled={!routesData}
        >
          <Save className="w-4 h-4" />
        </button>
        <button
          onClick={onReset}
          className="react-flow__controls-button"
          title="Reset to Original"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <SearchDialog 
          onHighlight={handleHighlight}
          className="react-flow__controls-button"
        />
        <DataSourceInput 
          className="react-flow__controls-button" 
          onDataLoad={onDataLoad}
          defaultOpen={showUploadDialog}
        />
      </ReactFlowControls>
    </>
  );
});

export default Controls;