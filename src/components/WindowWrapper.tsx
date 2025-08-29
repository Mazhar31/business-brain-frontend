import { useState, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WindowControls from "@/components/WindowControls";

interface WindowWrapperProps {
  title: string;
  children: ReactNode;
  className?: string;
  defaultMinimized?: boolean;
  defaultMaximized?: boolean;
}

const WindowWrapper = ({ 
  title, 
  children, 
  className = "",
  defaultMinimized = false,
  defaultMaximized = false
}: WindowWrapperProps) => {
  const [windowState, setWindowState] = useState({ 
    minimized: defaultMinimized, 
    maximized: defaultMaximized 
  });

  return (
    <Card className={`${className} ${windowState.maximized ? 'fixed inset-4 z-50 bg-background' : ''}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <WindowControls
            isMinimized={windowState.minimized}
            isMaximized={windowState.maximized}
            onMinimize={() => setWindowState({ minimized: true, maximized: false })}
            onMaximize={() => setWindowState({ minimized: false, maximized: true })}
            onRestore={() => setWindowState({ minimized: false, maximized: false })}
          />
        </CardTitle>
      </CardHeader>
      {!windowState.minimized && (
        <CardContent className={windowState.maximized ? "h-full overflow-auto" : ""}>
          {children}
        </CardContent>
      )}
    </Card>
  );
};

export default WindowWrapper;