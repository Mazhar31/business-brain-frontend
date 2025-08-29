// src/pages/Integrations.tsx - Complete integrations page
import { useState, useEffect } from "react";
import { 
  Mail, 
  Mic, 
  FileText, 
  MessageSquare, 
  Zap, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Settings,
  Users,
  Calendar,
  Github,
  Slack
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import WindowControls from "@/components/WindowControls";
import { gmailService } from "@/services/gmailService";
import { useGmail } from "@/contexts/GmailContext";

interface Integration {
  id: string;
  name: string;
  type: string;
  icon: any;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  config?: any;
  category: 'meeting' | 'communication' | 'storage' | 'productivity';
}

const Integrations = () => {
  const { toast } = useToast();
  const { isConnected: gmailConnected, connectedEmail, setConnectionStatus } = useGmail();
  const [loading, setLoading] = useState(true);
  
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "fathom",
      name: "Fathom AI",
      type: "meeting",
      icon: Mic,
      description: "Automatically capture and transcribe Google Meet sessions",
      status: "disconnected",
      category: "meeting"
    },
    {
      id: "gmail",
      name: "Gmail",
      type: "email",
      icon: Mail,
      description: "Monitor inbox for meeting summaries and documents",
      status: "disconnected",
      category: "communication"
    },
    {
      id: "hubspot",
      name: "HubSpot",
      type: "crm",
      icon: MessageSquare,
      description: "Sync customer interactions and meeting notes",
      status: "disconnected",
      category: "productivity"
    },
    {
      id: "slack",
      name: "Slack",
      type: "communication",
      icon: Slack,
      description: "Import channel discussions and team insights",
      status: "connected",
      category: "communication"
    },
    {
      id: "zoom",
      name: "Zoom",
      type: "meeting",
      icon: Mic,
      description: "Record and transcribe Zoom meetings automatically",
      status: "disconnected",
      category: "meeting"
    },
    {
      id: "teams",
      name: "Microsoft Teams",
      type: "meeting",
      icon: MessageSquare,
      description: "Capture Teams meetings and chat conversations",
      status: "disconnected",
      category: "meeting"
    },
    {
      id: "drive",
      name: "Google Drive",
      type: "storage",
      icon: FileText,
      description: "Sync documents and files from Google Drive",
      status: "connected",
      category: "storage"
    },
    {
      id: "notion",
      name: "Notion",
      type: "productivity",
      icon: FileText,
      description: "Import notes and documentation from Notion",
      status: "disconnected",
      category: "productivity"
    }
  ]);

  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [pageMaximized, setPageMaximized] = useState(false);
  const [pageMinimized, setPageMinimized] = useState(false);

  // Update Gmail integration status based on context
  useEffect(() => {
    setIntegrations(prev => 
      prev.map(int => 
        int.id === 'gmail' 
          ? { 
              ...int, 
              status: gmailConnected ? 'connected' : 'disconnected',
              config: gmailConnected ? { email: connectedEmail } : undefined
            }
          : int
      )
    );
    setLoading(false);
  }, [gmailConnected, connectedEmail]);

  const handleConnect = async (integration: Integration) => {
    setIsConnecting(true);
    
    try {
      if (integration.id === 'gmail') {
        // Start Gmail OAuth flow
        gmailService.startAuth();
        return; // OAuth will redirect, so don't continue
      } else {
        // Simulate other integrations
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setIntegrations(prev => 
          prev.map(int => 
            int.id === integration.id 
              ? { ...int, status: 'connected' }
              : int
          )
        );
        
        toast({
          title: "Integration connected",
          description: `${integration.name} has been successfully connected.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect integration",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
      setSelectedIntegration(null);
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    try {
      if (integration.id === 'gmail') {
        const result = await gmailService.disconnect();
        if (result.success) {
          setConnectionStatus(false);
          
          toast({
            title: "Gmail disconnected",
            description: "Your Gmail account has been disconnected successfully.",
          });
        } else {
          throw new Error(result.error);
        }
      } else {
        setIntegrations(prev => 
          prev.map(int => 
            int.id === integration.id 
              ? { ...int, status: 'disconnected' }
              : int
          )
        );
        
        toast({
          title: "Integration disconnected",
          description: `${integration.name} has been disconnected.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Disconnection failed",
        description: error.message || "Failed to disconnect integration",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Plus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case 'error':
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meeting': return <Mic className="w-4 h-4" />;
      case 'communication': return <MessageSquare className="w-4 h-4" />;
      case 'storage': return <FileText className="w-4 h-4" />;
      case 'productivity': return <Settings className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const filteredIntegrations = activeTab === "all" 
    ? integrations 
    : integrations.filter(int => int.category === activeTab);

  const connectedCount = integrations.filter(int => int.status === 'connected').length;
  const availableCount = integrations.filter(int => int.status === 'disconnected').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <Zap className="w-8 h-8 text-primary" />
              Integrations
            </h1>
            <p className="text-muted-foreground">
              Connect your tools to automatically capture and process company knowledge
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Request Integration
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
                <span className="text-sm">Integrations Content</span>
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
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Connected</p>
                  <p className="text-2xl font-bold text-foreground">{connectedCount}</p>
                </div>
                <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold text-foreground">{availableCount}</p>
                </div>
                <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{integrations.length}</p>
                </div>
                <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Settings className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              All ({integrations.length})
            </TabsTrigger>
            <TabsTrigger value="meeting" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Meetings ({integrations.filter(i => i.category === 'meeting').length})
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Communication ({integrations.filter(i => i.category === 'communication').length})
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Storage ({integrations.filter(i => i.category === 'storage').length})
            </TabsTrigger>
            <TabsTrigger value="productivity" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Productivity ({integrations.filter(i => i.category === 'productivity').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIntegrations.map((integration) => (
                <Card key={integration.id} className="glass-card hover:glass-card-hover transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-primary rounded-lg">
                          <integration.icon className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(integration.category)}
                            <p className="text-sm text-muted-foreground capitalize">{integration.category}</p>
                          </div>
                        </div>
                      </div>
                      
                      <Badge className={`${getStatusColor(integration.status)} capitalize`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(integration.status)}
                          {integration.status}
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {integration.description}
                    </p>
                    
                    <div className="flex gap-2">
                      {integration.status === 'connected' ? (
                        <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => setSelectedIntegration(integration)}
                              >
                                <Settings className="w-4 h-4 mr-2" />
                                Configure
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Configure {integration.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                                  <CheckCircle className="w-8 h-8 text-green-500" />
                                  <div>
                                    <h3 className="font-semibold text-green-500">Connected</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {integration.id === 'gmail' && integration.config?.email 
                                        ? `Connected to ${integration.config.email}` 
                                        : `${integration.name} is working properly`
                                      }
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="space-y-3">
                                  <Label>Status</Label>
                                  <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-sm">
                                      {integration.id === 'gmail' ? 'Monitoring inbox for new emails' : 'Last sync: 2 minutes ago'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {integration.id === 'gmail' ? 'Real-time notifications enabled' : 'Next sync: In 5 minutes'}
                                    </p>
                                  </div>
                                </div>
                                
                                <Button 
                                  variant="destructive" 
                                  onClick={() => {
                                    handleDisconnect(integration);
                                    setSelectedIntegration(null);
                                  }}
                                  className="w-full"
                                >
                                  Disconnect {integration.name}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ai"
                              className="flex-1"
                              onClick={() => setSelectedIntegration(integration)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Connect
                            </Button>
                          </DialogTrigger>
                          
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Connect {integration.name}</DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                                <integration.icon className="w-8 h-8 text-primary" />
                                <div>
                                  <h3 className="font-semibold">{integration.name}</h3>
                                  <p className="text-sm text-muted-foreground">{integration.description}</p>
                                </div>
                              </div>
                              
                              {integration.id === 'gmail' && (
                                <div className="space-y-3">
                                  <Label>Gmail Address</Label>
                                  <Input placeholder="your-email@company.com" />
                                  <p className="text-xs text-muted-foreground">
                                    We'll monitor this inbox for meeting summaries and documents
                                  </p>
                                </div>
                              )}
                              
                              {integration.id === 'fathom' && (
                                <div className="space-y-3">
                                  <Label>Webhook URL</Label>
                                  <Input 
                                    value="https://your-app.com/api/webhooks/fathom" 
                                    readOnly 
                                    className="bg-muted/50"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Copy this URL to your Fathom webhook settings
                                  </p>
                                </div>
                              )}

                              {integration.id === 'slack' && (
                                <div className="space-y-3">
                                  <Label>Workspace</Label>
                                  <Input placeholder="your-workspace.slack.com" />
                                  <p className="text-xs text-muted-foreground">
                                    We'll import relevant channel discussions and direct messages
                                  </p>
                                </div>
                              )}

                              {integration.id === 'hubspot' && (
                                <div className="space-y-3">
                                  <Label>API Key</Label>
                                  <Input placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" type="password" />
                                  <p className="text-xs text-muted-foreground">
                                    Generate an API key from your HubSpot settings
                                  </p>
                                </div>
                              )}
                              
                              <Button 
                                onClick={() => selectedIntegration && handleConnect(selectedIntegration)}
                                disabled={isConnecting}
                                className="w-full"
                              >
                                {isConnecting ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                                    Connecting...
                                  </>
                                ) : (
                                  `Connect ${integration.name}`
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Coming Soon Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Salesforce", icon: Users },
                { name: "Calendly", icon: Calendar },
                { name: "GitHub", icon: Github },
                { name: "Dropbox", icon: Upload }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 opacity-60">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>
      
      {/* Page Maximized Overlay */}
      {pageMaximized && (
        <div className="fixed top-0 left-64 right-0 bottom-0 z-50 bg-background p-4 overflow-auto lg:left-64">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Integrations - Maximized</h1>
            <WindowControls
              isMinimized={false}
              isMaximized={true}
              onMinimize={() => {}}
              onMaximize={() => {}}
              onRestore={() => setPageMaximized(false)}
            />
          </div>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
                  <Zap className="w-8 h-8 text-primary" />
                  Integrations
                </h1>
                <p className="text-muted-foreground">
                  Connect your tools to automatically capture and process company knowledge
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Connected</p>
                      <p className="text-2xl font-bold text-foreground">{connectedCount}</p>
                    </div>
                    <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Available</p>
                      <p className="text-2xl font-bold text-foreground">{availableCount}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <Zap className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold text-foreground">{integrations.length}</p>
                    </div>
                    <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <Settings className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.slice(0, 6).map((integration) => (
                <Card key={integration.id} className="glass-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-primary rounded-lg">
                          <integration.icon className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(integration.status)} capitalize`}>
                        {integration.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {integration.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Integrations;