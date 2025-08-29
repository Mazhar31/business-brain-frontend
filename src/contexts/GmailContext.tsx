import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { gmailService } from '@/services/gmailService';

interface GmailContextType {
  isConnected: boolean;
  connectedEmail: string | null;
  isLoading: boolean;
  emails: any[];
  totalEmails: number;
  unreadCount: number;
  emailsLoaded: boolean;
  checkConnection: () => Promise<void>;
  setConnectionStatus: (connected: boolean, email?: string) => void;
  loadEmails: (page?: number, force?: boolean) => Promise<void>;
  updateEmail: (emailId: string, updates: any) => void;
  addEmail: (email: any) => void;
}

const GmailContext = createContext<GmailContextType | undefined>(undefined);

export const GmailProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastCheck, setLastCheck] = useState<number>(0);
  const [emails, setEmails] = useState<any[]>([]);
  const [totalEmails, setTotalEmails] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [emailsLoaded, setEmailsLoaded] = useState<boolean>(false);

  const checkConnection = async (force = false) => {
    const now = Date.now();
    // Only check if forced or if it's been more than 5 minutes since last check
    if (!force && now - lastCheck < 5 * 60 * 1000 && lastCheck > 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await gmailService.checkConnection();
      if (result.success && result.data) {
        setIsConnected(result.data.connected);
        setConnectedEmail(result.data.email_address || null);
        setLastCheck(now);
      } else {
        setIsConnected(false);
        setConnectedEmail(null);
      }
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
      setIsConnected(false);
      setConnectedEmail(null);
    } finally {
      setIsLoading(false);
    }
  };

  const setConnectionStatus = (connected: boolean, email?: string) => {
    setIsConnected(connected);
    setConnectedEmail(email || null);
    setLastCheck(Date.now());
    if (!connected) {
      // Clear emails when disconnected
      setEmails([]);
      setTotalEmails(0);
      setUnreadCount(0);
      setEmailsLoaded(false);
    }
  };

  const loadEmails = async (page = 1, force = false) => {
    // Don't reload if already loaded and not forced
    if (emailsLoaded && !force) {
      return;
    }

    if (!isConnected) {
      return;
    }

    try {
      const offset = (page - 1) * 20;
      const response = await gmailService.getEmails({ limit: 20, offset });
      
      if (response.success && response.data) {
        setEmails(response.data.emails);
        setTotalEmails(response.data.total);
        setUnreadCount(response.data.unread_count);
        setEmailsLoaded(true);
      }
    } catch (error) {
      console.error('Error loading emails:', error);
    }
  };

  const updateEmail = (emailId: string, updates: any) => {
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, ...updates } : email
    ));
    
    // Update unread count if read status changed
    if (updates.is_read !== undefined) {
      setUnreadCount(prev => updates.is_read ? Math.max(0, prev - 1) : prev + 1);
    }
  };

  const addEmail = (email: any) => {
    setEmails(prev => [email, ...prev]);
    setTotalEmails(prev => prev + 1);
    setUnreadCount(prev => prev + 1);
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <GmailContext.Provider value={{
      isConnected,
      connectedEmail,
      isLoading,
      emails,
      totalEmails,
      unreadCount,
      emailsLoaded,
      checkConnection,
      setConnectionStatus,
      loadEmails,
      updateEmail,
      addEmail
    }}>
      {children}
    </GmailContext.Provider>
  );
};

export const useGmail = () => {
  const context = useContext(GmailContext);
  if (!context) {
    throw new Error('useGmail must be used within a GmailProvider');
  }
  return context;
};