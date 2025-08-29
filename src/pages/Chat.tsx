
import { useState } from "react";
import { Brain, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import EnhancedChat from "@/components/EnhancedChat";
import SmartSearchBar from "@/components/SmartSearchBar";
import QuickCaptureModal from "@/components/QuickCaptureModal";
import WindowControls from "@/components/WindowControls";
import { useToast } from "@/hooks/use-toast";

const Chat = () => {
  const { toast } = useToast();
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [pageMaximized, setPageMaximized] = useState(false);
  const [pageMinimized, setPageMinimized] = useState(false);

  const handleSearch = (query: string) => {
    // This would trigger the chat with the query
    console.log("Search query:", query);
  };

  const handleSuggestionSelect = (suggestion: any) => {
    if (suggestion.type === 'action' && suggestion.title.includes('Upload')) {
      setShowQuickCapture(true);
    }
  };

  const handleQuickCapture = (data: any) => {
    toast({
      title: "Captured successfully", 
      description: `Your ${data.type} has been saved and is being processed.`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="text-center space-y-4 flex-1">
            <div className="flex items-center justify-center gap-3">
              <Brain className="w-8 h-8 text-primary brain-glow animate-pulse" />
              <h1 className="text-3xl font-display font-bold text-foreground">
                Business Brain Chat
              </h1>
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ask anything about your company knowledge. I understand context, find connections, and provide precise answers with sources.
            </p>
          </div>
          <WindowControls
            isMinimized={pageMinimized}
            isMaximized={pageMaximized}
            onMinimize={() => setPageMinimized(true)}
            onMaximize={() => { setPageMaximized(true); setPageMinimized(false); }}
            onRestore={() => { setPageMaximized(false); setPageMinimized(false); }}
          />
        </div>

        {/* Page Minimized Box */}
        {pageMinimized ? (
          <Card className="glass-card h-16">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className="text-sm">Chat Content</span>
                <WindowControls
                  isMinimized={true}
                  isMaximized={false}
                  onMinimize={() => {}}
                  onMaximize={() => { setPageMaximized(true); setPageMinimized(false); }}
                  onRestore={() => setPageMinimized(false)}
                />
              </CardTitle>
            </CardHeader>
          </Card>
        ) : (
          <>
            {/* Smart Search Bar for quick queries */}
            <div className="max-w-4xl mx-auto">
              <SmartSearchBar
                onSearch={handleSearch}
                onSuggestionSelect={handleSuggestionSelect}
                placeholder="Ask your Business Brain anything..."
              />
            </div>

            {/* Quick Actions */}
            <div className="flex justify-center">
              <Button 
                variant="glass" 
                onClick={() => setShowQuickCapture(true)}
                className="group"
              >
                <Plus className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform" />
                Add Knowledge
              </Button>
            </div>

            {/* Enhanced Chat Component */}
            <EnhancedChat />
          </>
        )}

        {/* Quick Capture Modal */}
        <QuickCaptureModal
          isOpen={showQuickCapture}
          onClose={() => setShowQuickCapture(false)}
          onSave={handleQuickCapture}
        />
      </div>
      
      {/* Page Maximized Overlay */}
      {pageMaximized && (
        <div className="fixed top-0 left-64 right-0 bottom-0 z-50 bg-background p-4 overflow-auto lg:left-64">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Chat - Maximized</h1>
            <WindowControls
              isMinimized={false}
              isMaximized={true}
              onMinimize={() => {}}
              onMaximize={() => {}}
              onRestore={() => setPageMaximized(false)}
            />
          </div>
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Brain className="w-8 h-8 text-primary brain-glow animate-pulse" />
                <h1 className="text-3xl font-display font-bold text-foreground">
                  Business Brain Chat
                </h1>
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Ask anything about your company knowledge. I understand context, find connections, and provide precise answers with sources.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <SmartSearchBar
                onSearch={handleSearch}
                onSuggestionSelect={handleSuggestionSelect}
                placeholder="Ask your Business Brain anything..."
              />
            </div>
            <div className="flex justify-center">
              <Button 
                variant="glass" 
                onClick={() => setShowQuickCapture(true)}
                className="group"
              >
                <Plus className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform" />
                Add Knowledge
              </Button>
            </div>
            <EnhancedChat />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Chat;
