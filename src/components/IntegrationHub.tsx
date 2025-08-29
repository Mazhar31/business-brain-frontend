
import { useState } from "react";
import { Mail, Mic, FileText, MessageSquare, Zap, Plus, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Integration {
  id: string;
  name: string;
  type: string;
  icon: any;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  config?: any;
}

const IntegrationHub = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "fathom",
      name: "Fathom AI",
      type: "meeting",
      icon: Mic,
      description: "Automatically capture and transcribe Google Meet sessions",
      status: "disconnected"
    },
    {
      id: "gmail",
      name: "Gmail",
      type: "email",
      icon: Mail,
      description: "Monitor inbox for meeting summaries and documents",
      status: "disconnected"
    },
    {
      id: "hubspot",
      name: "HubSpot",
      type: "crm",
      icon: MessageSquare,
      description: "Sync customer interactions and meeting notes",
      status: "disconnected"
    },
    {
      id: "slack",
      name: "Slack",
      type: "communication",
      icon: MessageSquare,
      description: "Import channel discussions and team insights",
      status: "connected"
    }
  ]);

  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async (integration: Integration) => {
    setIsConnecting(true);
    
    // Simulate OAuth or API connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIntegrations(prev => 
      prev.map(int => 
        int.id === integration.id 
          ? { ...int, status: 'connected' }
          : int
      )
    );
    
    setIsConnecting(false);
    setSelectedIntegration(null);
    
    toast({
      title: "Integration connected",
      description: `${integration.name} has been successfully connected.`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-accent" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Plus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return "bg-accent/20 text-accent border-accent/30";
      case 'error':
        return "bg-destructive/20 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Integration Hub</h2>
        <p className="text-muted-foreground">
          Connect your tools to automatically capture and process company knowledge
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="glass-card hover:bg-card/60 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <integration.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">{integration.type}</p>
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
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant={integration.status === 'connected' ? 'glass' : 'ai'}
                    className="w-full"
                    onClick={() => setSelectedIntegration(integration)}
                  >
                    {integration.status === 'connected' ? 'Manage' : 'Connect'}
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
                          We'll monitor this inbox for Fathom meeting summaries
                        </p>
                      </div>
                    )}
                    
                    {integration.id === 'fathom' && (
                      <div className="space-y-3">
                        <Label>Webhook URL</Label>
                        <Input placeholder="https://app.fathom.video/api/webhook" />
                        <p className="text-xs text-muted-foreground">
                          Copy this URL to your Fathom webhook settings
                        </p>
                      </div>
                    )}
                    
                    <Button 
                      onClick={() => selectedIntegration && handleConnect(selectedIntegration)}
                      disabled={isConnecting}
                      className="w-full"
                    >
                      {isConnecting ? "Connecting..." : `Connect ${integration.name}`}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default IntegrationHub;
