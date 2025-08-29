import { useState, useEffect } from "react";
import { 
  Search, 
  Mail, 
  MailOpen, 
  Star, 
  Archive, 
  Trash2, 
  RefreshCw,
  Settings,
  Filter,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Reply,
  ReplyAll,
  Forward,
  MoreHorizontal,
  Shield,
  Eye,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import WindowControls from "@/components/WindowControls";
import { gmailService, Email, EmailDetail } from "@/services/gmailService";
import { useAuth } from "@/contexts/AuthContext";
import { useGmail } from "@/contexts/GmailContext";

const Inbox = () => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { 
    isConnected, 
    isLoading: gmailLoading, 
    emails: cachedEmails,
    totalEmails: cachedTotal,
    unreadCount: cachedUnreadCount,
    emailsLoaded,
    setConnectionStatus,
    loadEmails: loadEmailsFromContext,
    updateEmail,
    addEmail
  } = useGmail();
  
  // State management
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [emailsPerPage] = useState(20);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [gmailEmail, setGmailEmail] = useState("");
  const [pageMaximized, setPageMaximized] = useState(false);
  const [pageMinimized, setPageMinimized] = useState(false);
  
  // Use cached data from context
  const emails = cachedEmails;
  const totalEmails = cachedTotal;
  const unreadCount = cachedUnreadCount;

  // Initialize component - handle OAuth callback
  useEffect(() => {
    const initializeInbox = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('gmail_connected') === 'true') {
        // Clear the URL parameter
        window.history.replaceState({}, '', '/inbox');
        
        // Update connection status and show success message
        setConnectionStatus(true);
        toast({
          title: "Gmail Connected!",
          description: "Your Gmail account has been connected successfully"
        });
      }
      
      // Load emails if connected and not already loaded
      if (isConnected && !gmailLoading && !emailsLoaded) {
        await loadEmailsFromContext();
      }
      
      if (!gmailLoading) {
        setLoading(false);
      }
    };
    
    initializeInbox();
  }, [isConnected, gmailLoading]);
  
  // Setup WebSocket when connected
  useEffect(() => {
    if (isConnected) {
      const userId = localStorage.getItem('user_id');
      if (userId) {
        const ws = gmailService.connectWebSocket(userId, handleWebSocketMessage);
        setWebsocket(ws);
        gmailService.startWatch();
      }
    }
    
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [isConnected]);
  
  const handleWebSocketMessage = (data: any) => {
    if (data.type === 'new_email') {
      // Add new email using context
      addEmail(data.data);
      
      toast({
        title: "New Email",
        description: `From: ${data.data.from_email}\nSubject: ${data.data.subject}`
      });
    }
  };

  const checkConnection = async () => {
    const result = await gmailService.checkConnection();
    if (result.success && result.data) {
      setIsConnected(result.data.connected);
    }
  };

  const loadEmails = async (page = 1) => {
    setLoading(true);
    try {
      await loadEmailsFromContext(page, true); // Force reload
    } catch (error: any) {
      console.error('Load emails error:', error);
      toast({
        title: "Error loading emails",
        description: "Failed to load emails",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = async (email: Email) => {
    try {
      const result = await gmailService.getEmailDetail(email.id);
      if (result.success && result.data) {
        setSelectedEmail(result.data);
        
        // Mark as read using context
        if (!email.is_read) {
          updateEmail(email.id, { is_read: true });
        }
      }
    } catch (error: any) {
      toast({
        title: "Failed to load email",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleToggleStar = async (email: Email) => {
    try {
      const result = await gmailService.toggleStar(email.id);
      if (result.success && result.data) {
        const newStarred = result.data.starred;
        updateEmail(email.id, { is_starred: newStarred });
        
        if (selectedEmail && selectedEmail.id === email.id) {
          setSelectedEmail(prev => prev ? { ...prev, is_starred: newStarred } : null);
        }
        
        toast({
          title: result.data.message,
          description: `Email ${newStarred ? 'starred' : 'unstarred'}`
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to update email",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRefresh = async () => {
    // Just reload emails instead of syncing
    await loadEmails(currentPage);
  };

  const handleConnectGmail = () => {
    setShowConsentModal(true);
  };

  const handleConfirmConnect = () => {
    console.log('Gmail connection flow started', gmailEmail || 'no specific email');
    setShowConsentModal(false);
    setLoading(true);
    
    try {
      gmailService.startAuth(gmailEmail || undefined);
    } catch (error: any) {
      setLoading(false);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to start Gmail authentication",
        variant: "destructive"
      });
    }
  };



  const handleDisconnectGmail = async () => {
    try {
      const result = await gmailService.disconnect();
      if (result.success) {
        setConnectionStatus(false);
        setSelectedEmail(null);
        
        if (websocket) {
          websocket.close();
          setWebsocket(null);
        }
        
        toast({
          title: "Gmail disconnected",
          description: "Your Gmail account has been disconnected"
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to disconnect",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredEmails = emails.filter(email => {
    const matchesSearch = !searchQuery || 
      email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.snippet?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === "all" || 
      (filterType === "unread" && !email.is_read) ||
      (filterType === "starred" && email.is_starred);
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const totalPages = Math.ceil(totalEmails / emailsPerPage);

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="glass-card max-w-md">
            <CardContent className="p-8 text-center">
              <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Connect Your Gmail
              </h3>
              <p className="text-muted-foreground mb-6">
                Connect your Gmail account to access your emails and manage your inbox
              </p>
              <Button onClick={handleConnectGmail} className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                Connect Gmail Account
              </Button>
              
              {/* Consent Modal */}
              <Dialog open={showConsentModal} onOpenChange={setShowConsentModal}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Gmail Access Permission
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      To provide you with email management features, we need access to your Gmail account.
                    </p>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Gmail Address (Optional)
                      </label>
                      <Input
                        type="email"
                        placeholder="Enter your Gmail address"
                        value={gmailEmail}
                        onChange={(e) => setGmailEmail(e.target.value)}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Leave empty to choose from your Google accounts
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Eye className="w-4 h-4 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Read your emails</p>
                          <p className="text-xs text-muted-foreground">View and search through your email messages</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Send className="w-4 h-4 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Manage email actions</p>
                          <p className="text-xs text-muted-foreground">Star, archive, and organize your emails</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Shield className="w-4 h-4 text-purple-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Secure access</p>
                          <p className="text-xs text-muted-foreground">Your data is encrypted and never stored permanently</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        You'll be redirected to Google's secure authorization page. You can revoke access anytime from your Google Account settings.
                      </p>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowConsentModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleConfirmConnect}>
                      Continue to Google
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if ((loading || gmailLoading) && emails.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your inbox...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Inbox
            </h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread messages` : "All caught up!"}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* <Button 
              variant="outline" 
              onClick={handleRefresh} 
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button> */}
            <Button 
              onClick={async () => {
                try {
                  const syncResult = await gmailService.syncEmails(50);
                  if (syncResult.success) {
                    toast({ title: "Emails synced", description: syncResult.data?.message });
                    await loadEmails();
                  }
                } catch (error: any) {
                  toast({ title: "Sync failed", description: error.message, variant: "destructive" });
                }
              }}
              disabled={loading}
            >
              <Mail className="w-4 h-4 mr-2" />
              Sync Emails
            </Button>
            <Button variant="outline" onClick={handleDisconnectGmail}>
              <Settings className="w-4 h-4 mr-2" />
              Disconnect Gmail
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
                <span className="text-sm">Inbox Content</span>
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
            {/* Search and Filters */}
            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-muted/50 border-border/50"
                    />
                  </div>
                  
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Emails</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="starred">Starred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="lg:col-span-1">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Messages ({filteredEmails.length})</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary">{unreadCount}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredEmails.length === 0 ? (
                    <div className="p-8 text-center">
                      <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchQuery ? "No emails match your search" : "No emails found"}
                      </p>
                    </div>
                  ) : (
                    filteredEmails.map((email) => (
                      <div
                        key={email.id}
                        onClick={() => handleEmailClick(email)}
                        className={`p-4 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors ${
                          selectedEmail?.id === email.id ? 'bg-muted/50' : ''
                        } ${!email.is_read ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 flex items-center gap-2">
                            {email.is_read ? (
                              <MailOpen className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Mail className="w-4 h-4 text-primary" />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStar(email);
                              }}
                              className="hover:text-yellow-500 transition-colors"
                            >
                              <Star className={`w-4 h-4 ${email.is_starred ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                            </button>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className={`text-sm truncate ${!email.is_read ? 'font-semibold' : 'font-medium'}`}>
                                {email.from_email?.split('@')[0] || 'Unknown'}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(email.date)}
                              </span>
                            </div>
                            <p className={`text-sm mb-1 truncate ${!email.is_read ? 'font-medium' : ''}`}>
                              {email.subject || 'No Subject'}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {email.snippet}
                            </p>
                            {email.attachments.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <Paperclip className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-border flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage - 1;
                        setCurrentPage(newPage);
                        loadEmails(newPage);
                      }}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage + 1;
                        setCurrentPage(newPage);
                        loadEmails(newPage);
                      }}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Email Detail */}
          <div className="lg:col-span-2">
            <Card className="glass-card">
              {selectedEmail ? (
                <>
                  <CardHeader className="border-b border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          {selectedEmail.subject || 'No Subject'}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>From: {selectedEmail.from_email}</span>
                          <span>To: {selectedEmail.to_email}</span>
                          <span>{formatDate(selectedEmail.date)}</span>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Reply className="w-4 h-4 mr-2" />
                            Reply
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ReplyAll className="w-4 h-4 mr-2" />
                            Reply All
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Forward className="w-4 h-4 mr-2" />
                            Forward
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    {selectedEmail.attachments.length > 0 && (
                      <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                          <Paperclip className="w-4 h-4" />
                          Attachments ({selectedEmail.attachments.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedEmail.attachments.map((attachment: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                              <span className="text-sm font-medium">{attachment.filename}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(attachment.size)}
                                </span>
                                <Button size="sm" variant="outline">
                                  Download
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="prose prose-sm max-w-none">
                      {selectedEmail.body_html ? (
                        <div dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans text-sm">
                          {selectedEmail.body_text}
                        </pre>
                      )}
                    </div>
                  </CardContent>
                  
                  <div className="p-4 border-t border-border flex gap-2">
                    <Button>
                      <Reply className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                    <Button variant="outline">
                      <ReplyAll className="w-4 h-4 mr-2" />
                      Reply All
                    </Button>
                    <Button variant="outline">
                      <Forward className="w-4 h-4 mr-2" />
                      Forward
                    </Button>
                  </div>
                </>
              ) : (
                <CardContent className="p-8 text-center">
                  <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Select an Email
                  </h3>
                  <p className="text-muted-foreground">
                    Choose an email from the list to view its contents
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
            </div>
          </>
        )}
      </div>
      
      {/* Page Maximized Overlay */}
      {pageMaximized && (
        <div className="fixed top-0 left-64 right-0 bottom-0 z-50 bg-background p-4 overflow-auto lg:left-64">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Inbox - Maximized</h1>
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
                <h1 className="text-3xl font-display font-bold text-foreground">
                  Inbox
                </h1>
                <p className="text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} unread messages` : "All caught up!"}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {/* <Button 
                  variant="outline" 
                  onClick={handleRefresh} 
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button> */}
                <Button 
                  onClick={async () => {
                    try {
                      const syncResult = await gmailService.syncEmails(50);
                      if (syncResult.success) {
                        toast({ title: "Emails synced", description: syncResult.data?.message });
                        await loadEmails();
                      }
                    } catch (error: any) {
                      toast({ title: "Sync failed", description: error.message, variant: "destructive" });
                    }
                  }}
                  disabled={loading}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Sync Emails
                </Button>
                <Button variant="outline" onClick={handleDisconnectGmail}>
                  <Settings className="w-4 h-4 mr-2" />
                  Disconnect Gmail
                </Button>
              </div>
            </div>
            
            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-muted/50 border-border/50"
                    />
                  </div>
                  
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Emails</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="starred">Starred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Messages ({filteredEmails.length})</span>
                      {unreadCount > 0 && (
                        <Badge variant="secondary">{unreadCount}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[600px] overflow-y-auto">
                      {filteredEmails.length === 0 ? (
                        <div className="p-8 text-center">
                          <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            {searchQuery ? "No emails match your search" : "No emails found"}
                          </p>
                        </div>
                      ) : (
                        filteredEmails.map((email) => (
                          <div
                            key={email.id}
                            onClick={() => handleEmailClick(email)}
                            className={`p-4 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors ${
                              selectedEmail?.id === email.id ? 'bg-muted/50' : ''
                            } ${!email.is_read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 flex items-center gap-2">
                                {email.is_read ? (
                                  <MailOpen className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <Mail className="w-4 h-4 text-primary" />
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleStar(email);
                                  }}
                                  className="hover:text-yellow-500 transition-colors"
                                >
                                  <Star className={`w-4 h-4 ${email.is_starred ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                                </button>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className={`text-sm truncate ${!email.is_read ? 'font-semibold' : 'font-medium'}`}>
                                    {email.from_email?.split('@')[0] || 'Unknown'}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(email.date)}
                                  </span>
                                </div>
                                <p className={`text-sm mb-1 truncate ${!email.is_read ? 'font-medium' : ''}`}>
                                  {email.subject || 'No Subject'}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {email.snippet}
                                </p>
                                {email.attachments.length > 0 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Paperclip className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-2">
                <Card className="glass-card">
                  {selectedEmail ? (
                    <>
                      <CardHeader className="border-b border-border">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                              {selectedEmail.subject || 'No Subject'}
                            </h2>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>From: {selectedEmail.from_email}</span>
                              <span>To: {selectedEmail.to_email}</span>
                              <span>{formatDate(selectedEmail.date)}</span>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Reply className="w-4 h-4 mr-2" />
                                Reply
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <ReplyAll className="w-4 h-4 mr-2" />
                                Reply All
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Forward className="w-4 h-4 mr-2" />
                                Forward
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-6">
                        {selectedEmail.attachments.length > 0 && (
                          <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                            <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                              <Paperclip className="w-4 h-4" />
                              Attachments ({selectedEmail.attachments.length})
                            </h4>
                            <div className="space-y-2">
                              {selectedEmail.attachments.map((attachment: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                                  <span className="text-sm font-medium">{attachment.filename}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                      {formatFileSize(attachment.size)}
                                    </span>
                                    <Button size="sm" variant="outline">
                                      Download
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="prose prose-sm max-w-none">
                          {selectedEmail.body_html ? (
                            <div dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
                          ) : (
                            <pre className="whitespace-pre-wrap font-sans text-sm">
                              {selectedEmail.body_text}
                            </pre>
                          )}
                        </div>
                      </CardContent>
                      
                      <div className="p-4 border-t border-border flex gap-2">
                        <Button>
                          <Reply className="w-4 h-4 mr-2" />
                          Reply
                        </Button>
                        <Button variant="outline">
                          <ReplyAll className="w-4 h-4 mr-2" />
                          Reply All
                        </Button>
                        <Button variant="outline">
                          <Forward className="w-4 h-4 mr-2" />
                          Forward
                        </Button>
                      </div>
                    </>
                  ) : (
                    <CardContent className="p-8 text-center">
                      <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Select an Email
                      </h3>
                      <p className="text-muted-foreground">
                        Choose an email from the list to view its contents
                      </p>
                    </CardContent>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Inbox;