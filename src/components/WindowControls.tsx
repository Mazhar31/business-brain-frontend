import { Minimize2, Maximize2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WindowControlsProps {
  isMinimized: boolean;
  isMaximized: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onRestore: () => void;
}

const WindowControls = ({ 
  isMinimized, 
  isMaximized, 
  onMinimize, 
  onMaximize, 
  onRestore 
}: WindowControlsProps) => {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={isMinimized ? onRestore : onMinimize}
        className="h-6 w-6 p-0 hover:bg-muted/50"
      >
        {isMinimized ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={isMaximized ? onRestore : onMaximize}
        className="h-6 w-6 p-0 hover:bg-muted/50"
      >
        {isMaximized ? (
          <Minimize2 className="h-3 w-3" />
        ) : (
          <Maximize2 className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
};

export default WindowControls;