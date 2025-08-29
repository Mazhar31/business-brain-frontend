// src/components/IntegratedChat.tsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Brain, 
  User, 
  Send, 
  Sparkles, 
  FileText, 
  Mic, 
  Edit3, 
  Plus,
  MessageSquare,
  Settings,
  Trash2,
  MoreHorizontal,
  X,
  Search,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { conversationService, Conversation, Message as BackendMessage, MessageSendRequest } from "@/services/conversationService";

// Frontend message interface that matches your existing EnhancedChat
interface FrontendMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: DocumentSource[];
}

interface DocumentSource {
  id: string;
  title: string;
  excerpt: string;
  confidence: number;
  document_type: string;
  metadata?: {
    type?: string;
    date?: string;
    speaker?: string;
  };
}

const IntegratedChat = () => {
  const { conversationId: paramConversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<FrontendMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchType, setSearchType] = useState<'semantic' | 'keyword' | 'hybrid'>('hybrid');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sample questions for new conversations
  const sampleQuestions = [
    "What are the key insights from my recent meetings?",
    "Show me documents about our Q4 strategy",
    "Find audio recordings mentioning customer feedback",
    "Summarize my notes about product development",
    "What did we discuss about pricing in our last meeting?"
  ];

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load specific conversation from URL params
  useEffect(() => {
    if (paramConversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === paramConversationId);
      if (conversation) {
        setCurrentConversation(conversation);
        loadMessages(paramConversationId);
      }
    }
  }, [paramConversationId, conversations]);

  // Handle search query from other pages
  useEffect(() => {
    const query = searchParams.get('q');
    if (query && !paramConversationId) {
      // Start a new conversation with this search
      handleQuickChat(query);
    }
  }, [searchParams]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when conversation changes
  useEffect(() => {
    if (currentConversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const result = await conversationService.getConversations();
      
      if (result.success && result.data) {
        setConversations(result.data.conversations);
      } else {
        toast({
          title: "Failed to load conversations",
          description: result.error || "Could not fetch your conversation history",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Something went wrong loading your conversations",
        variant: "destructive"
      });
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      const result = await conversationService.getMessages(conversationId);
      
      if (result.success && result.data) {
        // Convert backend messages to frontend format
        const frontendMessages: FrontendMessage[] = result.data.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          sources: msg.metadata?.sources || []
        }));
        
        setMessages(frontendMessages);
      } else {
        toast({
          title: "Failed to load messages",
          description: result.error || "Could not fetch conversation messages",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Something went wrong loading the conversation",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // If no current conversation, create one
    if (!currentConversation) {
      await handleQuickChat(input);
      return;
    }

    const messageRequest: MessageSendRequest = {
      content: input.trim(),
      search_type: searchType,
      max_results: 5
    };

    // Add user message immediately for better UX
    const userMessage: FrontendMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await conversationService.sendMessage(currentConversation.id, messageRequest);

      if (result.success && result.data) {
        // Remove temporary message and add real ones
        setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
        
        const { user_message, assistant_message, search_results } = result.data;

        // Add both user and assistant messages
        const newMessages: FrontendMessage[] = [
          {
            id: user_message.id,
            role: user_message.role,
            content: user_message.content,
            timestamp: new Date(user_message.created_at),
          },
          {
            id: assistant_message.id,
            role: assistant_message.role,
            content: assistant_message.content,
            timestamp: new Date(assistant_message.created_at),
            sources: search_results?.relevant_documents?.map((doc: any) => ({
              id: doc.id,
              title: doc.title,
              excerpt: doc.preview || '',
              confidence: doc.combined_score || doc.semantic_score || 0,
              document_type: doc.document_type,
              metadata: {
                type: doc.document_type,
                date: doc.filename || '',
              }
            })) || []
          }
        ];

        setMessages(prev => [...prev, ...newMessages]);

        // Update conversation in sidebar
        setConversations(prev => 
          prev.map(conv => 
            conv.id === currentConversation.id 
              ? { 
                  ...conv, 
                  message_count: conv.message_count + 2,
                  last_message: assistant_message.content.slice(0, 100),
                  last_message_at: assistant_message.created_at
                }
              : conv
          )
        );

      } else {
        throw new Error(result.error || 'Failed to send message');
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      
      toast({
        title: "Message Failed",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickChat = async (message: string) => {
    const messageRequest: MessageSendRequest = {
      content: message.trim(),
      search_type: searchType,
      max_results: 5
    };

    setInput("");
    setIsLoading(true);

    try {
      const result = await conversationService.quickChat(messageRequest);

      if (result.success && result.data) {
        const { conversation, user_message, assistant_message, search_results } = result.data;

        // Update conversations list
        setConversations(prev => [conversation, ...prev]);
        setCurrentConversation(conversation);

        // Set messages
        const newMessages: FrontendMessage[] = [
          {
            id: user_message.id,
            role: user_message.role,
            content: user_message.content,
            timestamp: new Date(user_message.created_at),
          },
          {
            id: assistant_message.id,
            role: assistant_message.role,
            content: assistant_message.content,
            timestamp: new Date(assistant_message.created_at),
            sources: search_results?.relevant_documents?.map((doc: any) => ({
              id: doc.id,
              title: doc.title,
              excerpt: doc.preview || '',
              confidence: doc.combined_score || doc.semantic_score || 0,
              document_type: doc.document_type,
              metadata: {
                type: doc.document_type,
                date: doc.filename || '',
              }
            })) || []
          }
        ];

        setMessages(newMessages);

        // Update URL
        navigate(`/chat/${conversation.id}`, { replace: true });

      } else {
        throw new Error(result.error || 'Failed to start chat');
      }

    } catch (error: any) {
      console.error('Quick chat error:', error);
      toast({
        title: "Chat Failed",
        description: error.message || "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    navigate('/chat');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    navigate(`/chat/${conversation.id}`);
    loadMessages(conversation.id);
  };

  const handleDeleteConversation = async (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const result = await conversationService.deleteConversation(conversation.id);
      
      if (result.success) {
        setConversations(prev => prev.filter(c => c.id !== conversation.id));
        
        // If this was the current conversation, clear it
        if (currentConversation?.id === conversation.id) {
          setCurrentConversation(null);
          setMessages([]);
          navigate('/chat');
        }

        toast({
          title: "Conversation deleted",
          description: "The conversation has been successfully deleted."
        });
      } else {
        throw new Error(result.error || 'Failed to delete conversation');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete conversation",
        variant: "destructive"
      });
    }
  };

  const handleQuestionClick = (question: string) => {
    setInput(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'document':
        return <FileText className="w-3 h-3" />;
      case 'audio':
        return <Mic className="w-3 h-3" />;
      case 'note':
        return <Edit3 className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-120px)]">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 border-r border-border bg-card/30 flex flex-col`}>
          {sidebarOpen && (
            <>
              {/* Sidebar Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Conversations
                  </h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleNewConversation}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Conversations List */}
              <ScrollArea className="flex-1 px-2">
                {isLoadingConversations ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No conversations yet
                  </div>
                ) : (
                  <div className="space-y-1 py-2">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => handleSelectConversation(conversation)}
                        className={`group flex items-start p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                          currentConversation?.id === conversation.id ? 'bg-muted/70' : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-foreground truncate">
                            {conversationService.truncateTitle(conversation.title)}
                          </h3>
                          {conversation.last_message && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {conversation.last_message}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                              {conversation.message_count} messages
                            </Badge>
                            {conversation.last_message_at && (
                              <span className="text-xs text-muted-foreground">
                                {conversationService.formatMessageTime(conversation.last_message_at)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem 
                              onClick={(e) => handleDeleteConversation(conversation, e)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-3 h-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-border bg-card/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="h-8 w-8 p-0"
              >
                {sidebarOpen ? <X className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
              </Button>
              
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <h1 className="font-semibold text-foreground">
                  {currentConversation ? conversationService.truncateTitle(currentConversation.title, 40) : "New Chat"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={searchType} onValueChange={(value: 'semantic' | 'keyword' | 'hybrid') => setSearchType(value)}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="semantic">Semantic</SelectItem>
                  <SelectItem value="keyword">Keyword</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            {/* Welcome Message for New Chats */}
            {messages.length === 0 && !isLoadingMessages && (
              <div className="max-w-2xl mx-auto text-center space-y-6 py-8">
                <div className="space-y-2">
                  <Brain className="w-12 h-12 text-primary mx-auto" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Welcome to your Business Brain
                  </h2>
                  <p className="text-muted-foreground">
                    Ask questions about your documents, meetings, and knowledge base
                  </p>
                </div>

                {/* Sample Questions */}
                <Card className="glass-card">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Try asking about:
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {sampleQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuestionClick(question)}
                          className="text-left p-3 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/50 hover:border-border transition-all duration-200 text-sm"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Messages */}
            {isLoadingMessages ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === "user" 
                          ? "bg-gradient-primary" 
                          : "bg-gradient-accent"
                      }`}>
                        {message.role === "user" ? (
                          <User className="w-4 h-4 text-primary-foreground" />
                        ) : (
                          <Brain className="w-4 h-4 text-accent-foreground" />
                        )}
                      </div>

                      {/* Message Content */}
                      <div className={`space-y-2 ${message.role === "user" ? "text-right" : "text-left"}`}>
                        <div className={`p-3 rounded-lg ${
                          message.role === "user" 
                            ? "bg-gradient-primary text-primary-foreground" 
                            : "bg-muted/50 text-foreground"
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>

                        {/* Sources */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              Found {message.sources.length} relevant source{message.sources.length !== 1 ? 's' : ''}:
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {message.sources.map((source, index) => (
                                <div
                                  key={source.id}
                                  className="p-3 rounded-lg bg-card/50 border border-border/50 text-xs space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {getSourceIcon(source.document_type)}
                                      <span className="font-medium text-foreground truncate">
                                        {source.title}
                                      </span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                      {Math.round(source.confidence * 100)}% match
                                    </Badge>
                                  </div>
                                  {source.excerpt && (
                                    <p className="text-muted-foreground line-clamp-2">
                                      {source.excerpt}
                                    </p>
                                  )}
                                  {source.metadata?.date && (
                                    <p className="text-muted-foreground">
                                      {source.metadata.date}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Timestamp */}
                        <p className="text-xs text-muted-foreground">
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator for new messages */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center">
                        <Brain className="w-4 h-4 text-accent-foreground" />
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-card/30">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={currentConversation ? "Ask a follow-up question..." : "Start a new conversation..."}
                    className="min-h-[44px] resize-none bg-muted/50 border-border/50"
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="sm"
                  variant="ai"
                  className="h-11 w-11 p-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Search type indicator */}
              <div className="flex items-center justify-center mt-2">
                <Badge variant="outline" className="text-xs">
                  Using {searchType} search
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default IntegratedChat;