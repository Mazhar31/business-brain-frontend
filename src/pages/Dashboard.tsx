// src/pages/Dashboard.tsx - Optimized with proper caching
import { useState, useEffect, useMemo } from "react";
import { Brain, FileText, Mic, Edit3, Search, Plus, TrendingUp, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import SmartSearchBar from "@/components/SmartSearchBar";
import FileUploader, { UploadFile } from "@/components/FileUploader";
import VoiceRecorder from "@/components/VoiceRecorder";
import NoteCreator from "@/components/NoteCreator";
import WindowControls from "@/components/WindowControls";


import { useData } from "@/contexts/DataContext"; // Use cached data
import { useAuth } from "@/contexts/AuthContext";

interface SearchSuggestion {
  id: string;
  type: 'document' | 'conversation' | 'insight' | 'action';
  title: string;
  subtitle?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Use cached data from DataContext instead of local loading
  const { 
    documents, 
    conversations, 
    stats, 
    documentsLoading,
    conversationsLoading,
    loadDocuments, 
    loadConversations,
    documentsError,
    conversationsError,
    isStale
  } = useData();

  // Local state for search and UI
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([]);
  
  // Page window state
  const [pageMaximized, setPageMaximized] = useState(false);
  const [pageMinimized, setPageMinimized] = useState(false);

  // Calculate recent activity from cached data
  const recentActivity = useMemo(() => {
    const allItems = [
      ...documents.map(doc => ({
        ...doc,
        type: 'document',
        name: doc.title || doc.filename || 'Untitled',
        status: doc.ocr_status || doc.transcription_status || 'completed'
      })),
      ...conversations.map(conv => ({
        id: conv.id,
        type: 'conversation',
        name: conv.title || 'Untitled Chat',
        status: 'completed',
        created_at: conv.created_at,
        updated_at: conv.updated_at
      }))
    ];

    return allItems
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
  }, [documents, conversations]);

  // Check if we should show initial loading (only when no data exists)
  const shouldShowInitialLoading = (documentsLoading && documents.length === 0) || 
                                  (conversationsLoading && conversations.length === 0);

  // Background refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadDocuments(true), // Force refresh
        loadConversations(true) // Force refresh
      ]);
      toast({
        title: "Dashboard refreshed",
        description: "Your data has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not update dashboard data.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh stale data in background
  useEffect(() => {
    if (isStale('documents')) {
      loadDocuments(); // Background refresh
    }
    if (isStale('conversations')) {
      loadConversations(); // Background refresh
    }
  }, []);

  // Search functionality
  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/knowledge?search=${encodeURIComponent(query)}`);
    }
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'document':
        navigate('/documents');
        break;
      case 'conversation':
        navigate('/chat');
        break;
      default:
        handleSearch(suggestion.title);
    }
  };

  // Mock suggestions based on actual data
  const searchSuggestions: SearchSuggestion[] = [
    { id: '1', type: 'insight', title: 'Recent meeting insights', subtitle: 'AI-generated summaries' },
    { id: '2', type: 'action', title: 'Upload new document', subtitle: 'Add to knowledge base' },
    { id: '3', type: 'document', title: 'View all documents', subtitle: `${stats.totalDocuments} files available` },
    { id: '4', type: 'conversation', title: 'Start new chat', subtitle: 'Ask questions about your data' }
  ];

  // Handle file upload
  const handleFileUpload = (files: File[]) => {
    const newFiles: UploadFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'pending'
    }));
    setUploadQueue(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadQueue(prev => prev.filter(f => f.id !== fileId));
  };

  // Quick actions
  const quickActions = [
    {
      title: "Upload Document",
      description: "Add PDFs, docs, or images",
      icon: FileText,
      action: () => setShowUploadModal(true),
      color: "bg-blue-500"
    },
    {
      title: "Quick Note",
      description: "Jot down thoughts",
      icon: Edit3,
      action: () => setShowNoteModal(true),
      color: "bg-orange-500"
    },
    {
      title: "Record Audio",
      description: "Capture meeting notes",
      icon: Mic,
      action: () => setShowAudioModal(true),
      color: "bg-green-500"
    },
    {
      title: "Start Chat",
      description: "Ask questions about your data",
      icon: Brain,
      action: () => navigate('/chat'),
      color: "bg-purple-500"
    },
  ];

  // Show minimal loading only when absolutely no data exists
  if (shouldShowInitialLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!
            </h1>
            <p className="text-muted-foreground">
              Your business intelligence dashboard
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <WindowControls
              isMinimized={pageMinimized}
              isMaximized={pageMaximized}
              onMinimize={() => setPageMinimized(true)}
              onMaximize={() => { setPageMaximized(true); setPageMinimized(false); }}
              onRestore={() => { setPageMaximized(false); setPageMinimized(false); }}
            />
          </div>
        </div>

        {/* Page Minimized Box */}
        {pageMinimized ? (
          <Card className="glass-card h-16">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className="text-sm">Dashboard Content</span>
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
            {/* Search Bar */}
            <div className="w-full">
              <SmartSearchBar
                placeholder="Search your knowledge base or ask a question..."
                onSearch={handleSearch}
                onSuggestionSelect={handleSuggestionSelect}
              />
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Documents</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalDocuments}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                  {documentsLoading && (
                    <div className="mt-2">
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 animate-pulse"></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Audio Files</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalAudio}</p>
                    </div>
                    <Mic className="w-8 h-8 text-green-500" />
                  </div>
                  {documentsLoading && (
                    <div className="mt-2">
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 animate-pulse"></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Notes</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalNotes}</p>
                    </div>
                    <Edit3 className="w-8 h-8 text-orange-500" />
                  </div>
                  {documentsLoading && (
                    <div className="mt-2">
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 animate-pulse"></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Conversations</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalConversations}</p>
                    </div>
                    <Brain className="w-8 h-8 text-purple-500" />
                  </div>
                  {conversationsLoading && (
                    <div className="mt-2">
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 animate-pulse"></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Card key={index} className="glass-card hover:bg-card/60 transition-all duration-300 cursor-pointer" onClick={action.action}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${action.color}`}>
                          <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{action.title}</h3>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          {item.type === 'document' && <FileText className="w-4 h-4 text-blue-500" />}
                          {item.type === 'conversation' && <Brain className="w-4 h-4 text-purple-500" />}
                          <div>
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(item.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {item.type}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No recent activity</p>
                      <Button variant="outline" className="mt-2" onClick={() => setShowUploadModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add your first document
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Insights */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
                    <h3 className="font-medium text-foreground mb-2">Knowledge Base Growth</h3>
                    <p className="text-sm text-muted-foreground">
                      You have {stats.totalItems} items in your knowledge base. 
                      {stats.totalItems > 0 ? " Great progress! " : " Start by adding some documents. "}
                      {stats.totalConversations > 0 && `You've had ${stats.totalConversations} AI conversations.`}
                    </p>
                  </div>

                  {stats.totalItems > 5 && (
                    <div className="p-4 bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-lg border border-green-500/20">
                      <h3 className="font-medium text-foreground mb-2">Search Ready</h3>
                      <p className="text-sm text-muted-foreground">
                        Your content is processed and ready for intelligent search. Try asking specific questions about your documents.
                      </p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/chat')}>
                        Start Chatting
                      </Button>
                    </div>
                  )}

                  {documentsError && (
                    <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                      <h3 className="font-medium text-foreground mb-2">Sync Issue</h3>
                      <p className="text-sm text-muted-foreground">
                        Having trouble loading your documents. Please refresh or check your connection.
                      </p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={handleRefresh}>
                        Try Again
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Upload Modal */}
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
            </DialogHeader>
            <FileUploader 
              onUpload={handleFileUpload}
              uploadQueue={uploadQueue}
              onRemoveFile={handleRemoveFile}
            />
          </DialogContent>
        </Dialog>

        {/* Audio Recording Modal */}
        <Dialog open={showAudioModal} onOpenChange={setShowAudioModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Record Audio</DialogTitle>
            </DialogHeader>
            <VoiceRecorder />
          </DialogContent>
        </Dialog>

        {/* Note Creation Modal */}
        <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Note</DialogTitle>
            </DialogHeader>
            <NoteCreator onClose={() => setShowNoteModal(false)} />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Page Maximized Overlay - Right side only */}
      {pageMaximized && (
        <div className="fixed top-0 left-64 right-0 bottom-0 z-50 bg-background p-4 overflow-auto lg:left-64">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Dashboard - Maximized</h1>
            <WindowControls
              isMinimized={false}
              isMaximized={true}
              onMinimize={() => {}}
              onMaximize={() => {}}
              onRestore={() => setPageMaximized(false)}
            />
          </div>
          <div className="space-y-8">
            {/* All dashboard content in maximized view */}
            <div className="w-full">
              <SmartSearchBar
                placeholder="Search your knowledge base or ask a question..."
                onSearch={handleSearch}
                onSuggestionSelect={handleSuggestionSelect}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Documents</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalDocuments}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Audio Files</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalAudio}</p>
                    </div>
                    <Mic className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Notes</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalNotes}</p>
                    </div>
                    <Edit3 className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Conversations</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalConversations}</p>
                    </div>
                    <Brain className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Quick Actions in maximized view */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Card key={index} className="glass-card hover:bg-card/60 transition-all duration-300 cursor-pointer" onClick={action.action}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${action.color}`}>
                          <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{action.title}</h3>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Recent Activity and AI Insights in maximized view */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          {item.type === 'document' && <FileText className="w-4 h-4 text-blue-500" />}
                          {item.type === 'conversation' && <Brain className="w-4 h-4 text-purple-500" />}
                          <div>
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(item.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {item.type}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
                    <h3 className="font-medium text-foreground mb-2">Knowledge Base Growth</h3>
                    <p className="text-sm text-muted-foreground">
                      You have {stats.totalItems} items in your knowledge base. 
                      {stats.totalItems > 0 ? " Great progress! " : " Start by adding some documents. "}
                      {stats.totalConversations > 0 && `You've had ${stats.totalConversations} AI conversations.`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;