import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eraser, Pen, RotateCcw, Type } from 'lucide-react';
import { useCapacitor } from '@/hooks/useCapacitor';

interface HandwritingCanvasProps {
  onTextExtracted?: (text: string) => void;
  onImageSaved?: (imageData: string) => void;
  className?: string;
}

export const HandwritingCanvas: React.FC<HandwritingCanvasProps> = ({
  onTextExtracted,
  onImageSaved,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser'>('pen');
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);
  const { isIOS, isNative } = useCapacitor();

  const startDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save current state for undo
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokeHistory(prev => [...prev, imageData]);

    setIsDrawing(true);

    let clientX, clientY;
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ('touches' in event) {
      event.preventDefault();
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (currentTool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'hsl(var(--foreground))';
      ctx.lineWidth = 2;
    } else {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 20;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, currentTool]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokeHistory([]);
  }, []);

  const undoStroke = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || strokeHistory.length === 0) return;

    const previousState = strokeHistory[strokeHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setStrokeHistory(prev => prev.slice(0, -1));
  }, [strokeHistory]);

  const extractText = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL('image/png');
    
    if (isNative && isIOS) {
      // In a real iOS app, this would use Vision framework
      // For now, we'll simulate OCR
      const mockText = "Handwritten text would be extracted here using iOS Vision framework";
      onTextExtracted?.(mockText);
    } else {
      // Web fallback - basic text recognition simulation
      onTextExtracted?.("Text extraction not available in web mode");
    }

    onImageSaved?.(imageData);
  }, [isNative, isIOS, onTextExtracted, onImageSaved]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="p-4 bg-background/80 backdrop-blur-sm border-border/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant={currentTool === 'pen' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('pen')}
            >
              <Pen className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'eraser' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('eraser')}
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undoStroke}
              disabled={strokeHistory.length === 0}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={extractText}
            >
              <Type className="h-4 w-4" />
              Extract Text
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
            >
              Clear
            </Button>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          className="w-full h-64 border border-border/20 rounded-lg bg-background cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        
        {isNative && isIOS && (
          <p className="text-sm text-muted-foreground mt-2">
            ✨ iPad Pro with Apple Pencil support enabled
          </p>
        )}
      </Card>
    </div>
  );
};