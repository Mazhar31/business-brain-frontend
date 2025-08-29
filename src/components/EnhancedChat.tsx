import { useState, useEffect, useRef } from "react";
import { Send, Brain, User, FileText, Languages, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { documentService, SearchResponse } from "@/services/documentService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  language?: string;
  sources?: DocumentSource[];
  timestamp: Date;
}

interface DocumentSource {
  id: string;
  title: string;
  excerpt: string;
  confidence: number;
  document_type: string;
  metadata: {
    speaker?: string;
    date?: string;
    type?: string;
  };
}

const EnhancedChat = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your Business Brain AI assistant. I can help you search through your documents, notes, and audio recordings. Ask me anything about your knowledge base!",
      language: "en",
      timestamp: new Date(),
    }
  ]);
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<'semantic' | 'keyword' | 'hybrid'>('hybrid');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: "en", name: "English" },
    { code: "ar", name: "العربية" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "it", name: "Italiano" },
    { code: "pt", name: "Português" },
    { code: "ru", name: "Русский" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },
    { code: "zh", name: "中文" }
  ];

  const sampleQuestions = [
    "What documents do I have about pricing strategy?",
    "Show me my recent audio recordings",
    "What are the key points from my meeting notes?",
    "Find information about customer feedback",
    "What audio files contain discussions about product development?",
    "Summarize my notes about competitive analysis"
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call your backend search API
      const result = await documentService.searchDocuments(input, searchType, 5);

      if (result.success && result.data) {
        const searchResponse: SearchResponse = result.data;
        
        // Convert search results to sources format
        const sources: DocumentSource[] = searchResponse.relevant_documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          excerpt: doc.preview || '',
          confidence: doc.combined_score || doc.semantic_score || doc.keyword_score || 0,
          document_type: doc.document_type,
          metadata: {
            type: doc.document_type,
            date: new Date().toISOString().split('T')[0] // Placeholder
          }
        }));

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: searchResponse.ai_response || "I found some relevant documents in your knowledge base.",
          language: "en",
          sources: sources,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(result.error || 'Search failed');
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      
      toast({
        title: "Search Error",
        description: error.message || "Failed to search your knowledge base. Please try again.",
        variant: "destructive",
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I'm having trouble searching your knowledge base right now. Please make sure you have uploaded some documents or try again in a moment.",
        language: "en",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionClick = (question: string) => {
    setInput(question);
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'document':
        return '📄';
      case 'audio':
        return '🎤';
      case 'note':
        return '✏️';
      default:
        return '📄';
    }
  };

  const getDocumentTypeBadge = (type: string) => {
    const colors = {
      'pdf': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'document': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'audio': 'bg-red-500/10 text-red-500 border-red-500/20',
      'note': 'bg-green-500/10 text-green-500 border-green-500/20'
    };
    
    return colors[type as keyof typeof colors] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Settings */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Search Type:</span>
            </div>
            
            <div className="flex gap-2">
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
            
            <div className="text-xs text-muted-foreground">
              {searchType === 'hybrid' && 'Best of both semantic and keyword search'}
              {searchType === 'semantic' && 'AI-powered meaning-based search'}  
              {searchType === 'keyword' && 'Traditional text matching'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample Questions */}
      {messages.length <= 1 && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Try asking about:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
      )}

      {/* Chat Messages */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
                      <p className="text-sm leading-relaxed">
                        {message.content}
                      </p>
                    </div>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Found {message.sources.length} relevant source{message.sources.length !== 1 ? 's' : ''}:
                        </p>
                        {message.sources.map((source) => (
                          <div key={source.id} className="p-2 bg-muted/30 rounded border border-border/50">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span>{getDocumentTypeIcon(source.document_type)}</span>
                                <span className="text-xs font-medium">{source.title}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getDocumentTypeBadge(source.document_type)}`}
                                >
                                  {source.document_type}
                                </Badge>
                                {source.confidence > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(source.confidence * 100)}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {source.excerpt && (
                              <p className="text-xs text-muted-foreground">{source.excerpt}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center">
                    <Brain className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div className="bg-muted/50 text-foreground p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your documents, notes, or audio recordings..."
                className="flex-1 bg-muted/50 border-border/50 min-h-[40px] max-h-32"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
              />
              <Button 
                onClick={handleSend} 
                disabled={!input.trim() || isLoading}
                variant="ai"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedChat;