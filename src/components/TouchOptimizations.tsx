import React, { useEffect } from 'react';
import { useCapacitor } from '@/hooks/useCapacitor';

interface TouchOptimizationsProps {
  children: React.ReactNode;
}

export const TouchOptimizations: React.FC<TouchOptimizationsProps> = ({ children }) => {
  const { isNative, isIOS } = useCapacitor();

  useEffect(() => {
    if (isNative && isIOS) {
      // Prevent zooming on double tap
      let lastTouchEnd = 0;
      document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      }, false);

      // Improve scrolling performance
      document.addEventListener('touchstart', function (e) {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      }, { passive: false });

      // Add iPad-specific CSS
      const style = document.createElement('style');
      style.textContent = `
        /* iPad-specific optimizations */
        * {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        
        input, textarea, [contenteditable] {
          -webkit-user-select: text;
          user-select: text;
        }
        
        .canvas-container {
          touch-action: none;
        }
        
        /* Apple Pencil optimizations */
        canvas {
          touch-action: none;
          -webkit-user-select: none;
          user-select: none;
        }
        
        /* Improve button touch targets */
        button {
          min-height: 44px;
          min-width: 44px;
        }
        
        /* Smooth animations */
        * {
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, [isNative, isIOS]);

  if (!isNative) {
    return <>{children}</>;
  }

  return (
    <div className="touch-optimized">
      {children}
    </div>
  );
};