import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Mic, PenTool, Upload, Type } from 'lucide-react';
import { useCapacitor } from '@/hooks/useCapacitor';
import QuickCaptureModal from './QuickCaptureModal';

export const FloatingCaptureButton: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('note');
  const { isNative } = useCapacitor();

  const handleCapture = (tab: string) => {
    setActiveTab(tab);
    setModalOpen(true);
    setIsExpanded(false);
  };

  const handleSave = (data: any) => {
    // Handle save logic here
    console.log('Captured data:', data);
    setModalOpen(false);
  };

  const actions = [
    { icon: Type, label: 'Note', tab: 'note', color: 'bg-blue-500' },
    { icon: Mic, label: 'Voice', tab: 'voice', color: 'bg-green-500' },
    { icon: Upload, label: 'File', tab: 'file', color: 'bg-purple-500' },
    ...(isNative ? [{ icon: PenTool, label: 'Draw', tab: 'handwriting', color: 'bg-orange-500' }] : [])
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Action buttons */}
        {isExpanded && (
          <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-200">
            {actions.map((action, index) => (
              <Button
                key={action.tab}
                size="lg"
                className={`${action.color} hover:${action.color}/90 shadow-lg backdrop-blur-sm border-0 text-white`}
                onClick={() => handleCapture(action.tab)}
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                <action.icon className="w-5 h-5" />
                <span className="ml-2 hidden sm:inline">{action.label}</span>
              </Button>
            ))}
          </div>
        )}
        
        {/* Main FAB */}
        <Button
          size="lg"
          className={`w-14 h-14 rounded-full shadow-xl backdrop-blur-sm border-0 transition-transform duration-200 ${
            isExpanded ? 'rotate-45 bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Quick Capture Modal */}
      <QuickCaptureModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
};