import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { gmailService } from '@/services/gmailService';
import { useToast } from '@/hooks/use-toast';

const GmailConnectionTest = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailCount, setEmailCount] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const { toast } = useToast();

  const checkConnection = async () => {
    setLoading(true);
    try {
      const result = await gmailService.checkConnection();
      if (result.success && result.data) {
        setIsConnected(result.data.connected);
        
        if (result.data.connected) {
          // Get email count
          const emailsResult = await gmailService.getEmails({ limit: 1 });
          if (emailsResult.success && emailsResult.data) {
            setEmailCount(emailsResult.data.total);
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Connection check failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    gmailService.startAuth();
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await gmailService.syncEmails(10);
      if (result.success && result.data) {
        setLastSync(new Date().toLocaleTimeString());
        toast({
          title: "Sync completed",
          description: result.data.message
        });
        await checkConnection();
      }
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Gmail Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Connection Status:</span>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? (
              <><CheckCircle className="w-3 h-3 mr-1" /> Connected</>
            ) : (
              <><XCircle className="w-3 h-3 mr-1" /> Not Connected</>
            )}
          </Badge>
        </div>

        {isConnected && (
          <div className="flex items-center justify-between">
            <span>Total Emails:</span>
            <Badge variant="outline">{emailCount}</Badge>
          </div>
        )}

        {lastSync && (
          <div className="flex items-center justify-between">
            <span>Last Sync:</span>
            <span className="text-sm text-muted-foreground">{lastSync}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={checkConnection} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Check
          </Button>

          {isConnected ? (
            <Button onClick={handleSync} disabled={loading} size="sm">
              Sync Emails
            </Button>
          ) : (
            <Button onClick={handleConnect} size="sm">
              Connect Gmail
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GmailConnectionTest;