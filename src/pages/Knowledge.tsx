// src/pages/Knowledge.tsx - Updated to use cached data
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Tag, Calendar, User, ArrowRight, Brain, RefreshCw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import WindowControls from "@/components/WindowControls";
import { documentService, Document } from "@/services/documentService";
import { useData } from "@/contexts/DataContext"; // NEW

// Updated interface to match your backend data structure
interface KnowledgeEntry {
  id: string;
  question: string; // Generated from document title/content
  answer: string; // Document content/preview
  source: string; // Document filename or title
  speaker?: string; // From metadata
  date: string; // Created date
  tags: string[]; // Generated from document type and metadata
  confidence: number; // From search scores
  document_type: 'pdf' | 'note' | 'audio';
  preview: string; // Document preview text
}

const Knowledge = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use cached data from DataContext
  const { 
    documents, 
    documentsLoading, 
    loadDocuments, 
    isStale 
  } = useData();
  
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'semantic' | 'keyword' | 'hybrid'>('hybrid');
  const [pageMaximized, setPageMaximized] = useState(false);
  const [pageMinimized, setPageMinimized] = useState(false);

  // Load documents only if stale
  useEffect(() => {
    if (isStale('documents')) {
      loadDocuments();
    }
  }, []);

  // Convert cached documents to knowledge entries when documents change
  useEffect(() => {
    if (documents.length > 0) {
      const entries = convertDocumentsToKnowledgeEntries(documents);
      setKnowledgeEntries(entries);
    }
  }, [documents]);

  // Filter entries based on search and type
  const filteredEntries = knowledgeEntries.filter(entry => {
    const matchesSearch = !searchQuery || 
      entry.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === "all" || entry.document_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const convertDocumentsToKnowledgeEntries = (documents: Document[]): KnowledgeEntry[] => {
    return documents.map(doc => ({
      id: doc.id,
      question: generateQuestionFromDocument(doc),
      answer: doc.ocr_text || doc.description || doc.content || "Content not available",
      source: doc.filename || doc.title,
      speaker: doc.metadata?.speaker,
      date: formatDate(doc.created_at),
      tags: generateTagsFromDocument(doc),
      confidence: 1.0, // Default confidence for browsing
      document_type: doc.document_type,
      preview: (doc.ocr_text || doc.description || doc.content || "").slice(0, 200)
    }));
  };

  const generateQuestionFromDocument = (doc: Document): string => {
    const content = doc.ocr_text || doc.description || doc.content || "";
    const title = doc.title || doc.filename || "Untitled Document";
    
    // If we have content, extract the first meaningful sentence/phrase
    if (content.trim()) {
      // Clean up the content and extract first meaningful part
      const cleanContent = content
        .replace(/^---.*?---/g, '') // Remove OCR markers like "--- Page 1 ---"
        .replace(/Generated:.*?\d{4}-\d{2}-\d{2}.*?UTC/g, '') // Remove timestamps
        .replace(/Author:.*$/gm, '') // Remove author lines
        .trim();
      
      // Find first sentence or meaningful phrase (up to 60 characters)
      const firstSentence = cleanContent
        .split(/[.!?]/)
        .find(sentence => sentence.trim().length > 10)?.trim();
      
      if (firstSentence && firstSentence.length > 10) {
        // Limit to ~50-60 characters for readability
        const truncated = firstSentence.length > 60 
          ? firstSentence.substring(0, 60).trim() + '...'
          : firstSentence;
        return truncated;
      }
      
      // Fallback: use first 50 characters of content
      const firstWords = cleanContent.substring(0, 50).trim();
      if (firstWords.length > 10) {
        return firstWords + (cleanContent.length > 50 ? '...' : '');
      }
    }
    
    // Final fallback: use cleaned filename as title
    return extractTopicFromTitle(title);
  };

  const extractKeyTerms = (content: string, title: string) => {
    return {
      hasMeeting: content.includes('meeting') || content.includes('call') || content.includes('discussion') || title.includes('meeting'),
      hasStrategy: content.includes('strategy') || content.includes('plan') || content.includes('roadmap') || title.includes('strategy'),
      hasAnalysis: content.includes('analysis') || content.includes('analyze') || content.includes('findings') || title.includes('analysis'),
      hasReport: content.includes('report') || content.includes('summary') || content.includes('overview') || title.includes('report'),
      hasCustomer: content.includes('customer') || content.includes('client') || content.includes('user') || title.includes('customer'),
      hasFeedback: content.includes('feedback') || content.includes('review') || content.includes('opinion') || title.includes('feedback'),
      hasProduct: content.includes('product') || content.includes('feature') || content.includes('development') || title.includes('product'),
      hasDevelopment: content.includes('development') || content.includes('build') || content.includes('implementation') || title.includes('development'),
      hasPricing: content.includes('pricing') || content.includes('price') || content.includes('cost') || title.includes('pricing'),
      hasSales: content.includes('sales') || content.includes('revenue') || content.includes('deal') || title.includes('sales'),
      mainTopic: extractMainTopicFromContent(content, title)
    };
  };

  const extractMainTopicFromContent = (content: string, title: string): string | null => {
    // Try to extract the main topic from content or title
    const commonTopics = [
      'q1', 'q2', 'q3', 'q4', 'quarterly', 'annual',
      'sprint', 'standup', 'retrospective', 'planning',
      'onboarding', 'training', 'workshop',
      'competitor', 'market', 'industry',
      'budget', 'financial', 'revenue',
      'launch', 'release', 'beta',
      'interview', 'hiring', 'team'
    ];

    const titleWords = title.toLowerCase().split(/[\s-_.,]+/);
    const contentWords = content.toLowerCase().split(/[\s-_.,]+/);
    
    for (const topic of commonTopics) {
      if (titleWords.includes(topic) || contentWords.includes(topic)) {
        return topic;
      }
    }
    
    // Return the most meaningful word from title (not "testing", "pdf", etc.)
    const meaningfulWords = titleWords.filter(word => 
      word.length > 3 && 
      !['testing', 'document', 'file', 'note'].includes(word)
    );
    
    return meaningfulWords[0] || null;
  };

  const extractTopicFromTitle = (title: string): string => {
    // Clean up the title and extract the main topic
    return title
      .replace(/\.(pdf|docx|txt|md)$/i, '')
      .replace(/^(ocr|rag|test|testing)\s+/i, '')
      .replace(/\s+(testing|pdf|document)$/i, '')
      .trim() || 'this content';
  };

  const extractDurationText = (doc: Document): string => {
    if (doc.metadata?.duration) {
      const minutes = Math.floor(doc.metadata.duration / 60);
      return minutes > 0 ? `${minutes}-minute` : 'short';
    }
    return '';
  };

  const detectNoteType = (title: string, content: string): string | null => {
    if (title.includes('meeting') || content.includes('meeting')) return 'meeting';
    if (title.includes('todo') || content.includes('todo') || content.includes('task')) return 'action item';
    if (title.includes('idea') || content.includes('brainstorm')) return 'brainstorming';
    if (title.includes('summary') || content.includes('summary')) return 'summary';
    return null;
  };

  const detectDocumentType = (title: string, content: string): string | null => {
    if (title.includes('guide') || content.includes('guide') || content.includes('tutorial')) return 'guide';
    if (title.includes('report') || content.includes('findings') || content.includes('analysis')) return 'report';
    if (title.includes('spec') || content.includes('requirements') || content.includes('specification')) return 'specification';
    if (title.includes('manual') || content.includes('instructions')) return 'manual';
    if (title.includes('proposal') || content.includes('proposal')) return 'proposal';
    return null;
  };

  const generateTagsFromDocument = (doc: Document): string[] => {
    const tags: string[] = [];
    
    // Add document type as tag
    tags.push(doc.document_type.charAt(0).toUpperCase() + doc.document_type.slice(1));
    
    // Add status tags
    if (doc.processing_status) {
      tags.push(doc.processing_status.charAt(0).toUpperCase() + doc.processing_status.slice(1));
    }
    
    // Add metadata-based tags
    if (doc.metadata?.language) {
      tags.push(doc.metadata.language.toUpperCase());
    }
    
    if (doc.metadata?.speaker) {
      tags.push(doc.metadata.speaker);
    }
    
    // Add content-based tags (simple keyword extraction)
    const content = doc.ocr_text || doc.description || doc.content || "";
    const commonKeywords = ['meeting', 'strategy', 'customer', 'product', 'sales', 'feedback', 'analysis'];
    commonKeywords.forEach(keyword => {
      if (content.toLowerCase().includes(keyword)) {
        tags.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    });
    
    return [...new Set(tags)]; // Remove duplicates
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // Reset to show all documents from cache
      const entries = convertDocumentsToKnowledgeEntries(documents);
      setKnowledgeEntries(entries);
      return;
    }

    try {
      setIsSearching(true);
      const result = await documentService.searchDocuments(searchQuery, searchType, 20);
      
      if (result.success && result.data) {
        // Convert search results to knowledge entries
        const searchEntries: KnowledgeEntry[] = result.data.relevant_documents.map((doc: any) => {
          // Find the full document data from cache
          const fullDoc = documents.find(d => d.id === doc.id);
          
          // Use the same content-based approach for search results
          const questionFromContent = fullDoc ? generateQuestionFromDocument(fullDoc) : doc.title;
          
          return {
            id: doc.id,
            question: questionFromContent,
            answer: doc.preview || "Content preview not available",
            source: doc.filename || doc.title,
            speaker: fullDoc?.metadata?.speaker,
            date: fullDoc ? formatDate(fullDoc.created_at) : "Unknown",
            tags: fullDoc ? generateTagsFromDocument(fullDoc) : [doc.document_type],
            confidence: doc.combined_score || doc.semantic_score || doc.keyword_score || 0,
            document_type: doc.document_type,
            preview: doc.preview || ""
          };
        });

        setKnowledgeEntries(searchEntries);
      } else {
        toast({
          title: "Search failed",
          description: result.error || "Could not search your knowledge base",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search error",
        description: error.message || "Something went wrong during search",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-500";
    if (confidence >= 0.8) return "text-yellow-500";
    if (confidence >= 0.6) return "text-orange-500";
    return "text-muted-foreground";
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case 'audio':
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case 'note':
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const handleEntryClick = (entry: KnowledgeEntry) => {
    // Navigate to chat with this specific document context
    navigate(`/chat?q=${encodeURIComponent(`Tell me about: ${entry.source}`)}`);
  };

  // Show loading only on initial load when no cached data
  if (documentsLoading && documents.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your knowledge base...</p>
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
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <Brain className="w-8 h-8 text-primary brain-glow" />
              Knowledge Base
            </h1>
            <p className="text-muted-foreground">
              AI-extracted insights from your documents, recordings, and notes
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ai" className="px-6" onClick={() => navigate("/chat")}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Ask Business Brain
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
                <span className="text-sm">Knowledge Base Content</span>
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
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search your knowledge base..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 bg-muted/50 border-border/50"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={searchType} onValueChange={(value: 'semantic' | 'keyword' | 'hybrid') => setSearchType(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="semantic">Semantic</SelectItem>
                    <SelectItem value="keyword">Keyword</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pdf">Documents</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="note">Notes</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching}
                  variant="ai"
                >
                  {isSearching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats - Using cached data */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{knowledgeEntries.length}</p>
              <p className="text-sm text-muted-foreground">Total Entries</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {knowledgeEntries.filter(e => e.document_type === 'pdf').length}
              </p>
              <p className="text-sm text-muted-foreground">Documents</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {knowledgeEntries.filter(e => e.document_type === 'audio').length}
              </p>
              <p className="text-sm text-muted-foreground">Recordings</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {knowledgeEntries.filter(e => e.document_type === 'note').length}
              </p>
              <p className="text-sm text-muted-foreground">Notes</p>
            </CardContent>
          </Card>
        </div>

        {/* Knowledge Entries */}
        {filteredEntries.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? "No matches found" : "No knowledge entries yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "Try adjusting your search terms or filters"
                  : "Upload some documents, record audio, or create notes to build your knowledge base"
                }
              </p>
              <Button 
                variant="ai" 
                onClick={() => navigate("/documents")}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Add Content
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredEntries.map((entry) => (
              <Card 
                key={entry.id} 
                className="glass-card hover:glass-card-hover cursor-pointer transition-all duration-300"
                onClick={() => handleEntryClick(entry)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-foreground mb-2 hover:text-primary transition-colors">
                        {entry.question}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {entry.date}
                        </div>
                        {entry.speaker && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {entry.speaker}
                          </div>
                        )}
                        <Badge variant="outline" className={getDocumentTypeColor(entry.document_type)}>
                          {entry.document_type.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {searchQuery && (
                        <Badge variant="secondary" className={`${getConfidenceColor(entry.confidence)} border`}>
                          {Math.round(entry.confidence * 100)}% match
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {entry.preview || entry.answer.slice(0, 300)}
                    {(entry.preview || entry.answer).length > 300 && "..."}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Source:</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {entry.source}
                      </Badge>
                    </div>
                    
                    {entry.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-muted-foreground" />
                        <div className="flex gap-1">
                          {entry.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {entry.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{entry.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load more button if needed */}
        {filteredEntries.length > 0 && filteredEntries.length === 20 && (
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => {/* Implement pagination if needed */}}
            >
              Load More Results
            </Button>
          </div>
        )}
          </>
        )}
      </div>
      
      {/* Page Maximized Overlay */}
      {pageMaximized && (
        <div className="fixed top-0 left-64 right-0 bottom-0 z-50 bg-background p-4 overflow-auto lg:left-64">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Knowledge Base - Maximized</h1>
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
                  <Brain className="w-8 h-8 text-primary brain-glow" />
                  Knowledge Base
                </h1>
                <p className="text-muted-foreground">
                  AI-extracted insights from your documents, recordings, and notes
                </p>
              </div>
            </div>
            
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search your knowledge base..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-muted/50 border-border/50"
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={isSearching} variant="ai">
                    {isSearching ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{knowledgeEntries.length}</p>
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {knowledgeEntries.filter(e => e.document_type === 'pdf').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Documents</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {knowledgeEntries.filter(e => e.document_type === 'audio').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Recordings</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {knowledgeEntries.filter(e => e.document_type === 'note').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Notes</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-6">
              {filteredEntries.slice(0, 5).map((entry) => (
                <Card key={entry.id} className="glass-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {entry.question}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {entry.date}
                      </div>
                      <Badge variant="outline" className={getDocumentTypeColor(entry.document_type)}>
                        {entry.document_type.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground">
                      {entry.preview || entry.answer.slice(0, 200)}...
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

export default Knowledge;