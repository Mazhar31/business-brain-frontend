// src/pages/Documents.tsx - Fixed version with cached data integration
import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  Archive, 
  FileText, 
  Mic, 
  Edit3, 
  MoreHorizontal, 
  Trash2, 
  Eye,
  Calendar,
  User,
  Upload,
  Download,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Document, documentService } from "@/services/documentService";
import { useData } from "@/contexts/DataContext";

// Upload file interface for the queue
export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

const Documents = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Use cached data from DataContext
  const { 
    documents, 
    documentsLoading, 
    loadDocuments, 
    addDocument, 
    updateDocument, 
    deleteDocument: deleteFromCache,
    isStale 
  } = useData();
  
  // Local state for UI
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [currentTab, setCurrentTab] = useState("all");
  const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [newNoteDialog, setNewNoteDialog] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  // Load documents only if stale
  useEffect(() => {
    if (isStale('documents')) {
      loadDocuments();
    }
  }, [isStale, loadDocuments]);

  // File upload handling
  const handleFileUpload = async (files: File[]) => {
    const newUploads: UploadFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'pending',
    }));

    setUploadQueue(prev => [...prev, ...newUploads]);

    // Process each file
    for (const upload of newUploads) {
      await processFileUpload(upload);
    }
  };

  const processFileUpload = async (upload: UploadFile) => {
    try {
      // Update status to uploading
      setUploadQueue(prev => prev.map(item => 
        item.id === upload.id ? { ...item, status: 'uploading' } : item
      ));

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadQueue(prev => prev.map(item => {
          if (item.id === upload.id && item.progress < 90) {
            return { ...item, progress: item.progress + 10 };
          }
          return item;
        }));
      }, 200);

      let result;
      
      // Determine upload type and call appropriate API
      if (upload.file.type === 'application/pdf' || upload.file.type.includes('document')) {
        result = await documentService.uploadDocument([upload.file]);
      } else if (upload.file.type.startsWith('audio/')) {
        const title = upload.file.name.replace(/\.[^/.]+$/, "");
        result = await documentService.uploadAudio(upload.file, title, '', 'en');
      } else {
        // Try document upload for other file types
        result = await documentService.uploadDocument([upload.file]);
      }

      clearInterval(progressInterval);

      if (result.success) {
        // Update to completed
        setUploadQueue(prev => prev.map(item => 
          item.id === upload.id ? { ...item, status: 'completed', progress: 100 } : item
        ));

        toast({
          title: "Upload successful",
          description: `${upload.file.name} has been uploaded and is being processed.`
        });

        // Add new documents to cache if available
        if (result.data?.documents) {
          result.data.documents.forEach((doc: Document) => {
            addDocument(doc);
          });
        } else if (result.data?.audio) {
          // Handle audio upload response
          addDocument(result.data.audio);
        }

        // Force refresh to get the latest data
        setTimeout(() => {
          loadDocuments(true);
        }, 1000);
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      
      setUploadQueue(prev => prev.map(item => 
        item.id === upload.id ? { 
          ...item, 
          status: 'failed', 
          error: error.message 
        } : item
      ));

      toast({
        title: "Upload failed",
        description: `Failed to upload ${upload.file.name}: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleRefresh = async () => {
    await loadDocuments(true); // Force refresh
    toast({
      title: "Documents refreshed",
      description: "Your document list has been updated"
    });
  };

  const handleDeleteDocument = async (document: Document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      let result;
      switch (documentToDelete.document_type) {
        case 'pdf':
          result = await documentService.deleteDocument(documentToDelete.id);
          break;
        case 'note':
          result = await documentService.deleteNote(documentToDelete.id);
          break;
        case 'audio':
          result = await documentService.deleteAudio(documentToDelete.id);
          break;
        default:
          result = await documentService.deleteDocument(documentToDelete.id);
      }

      if (result.success) {
        // Update cache immediately
        deleteFromCache(documentToDelete.id);
        
        toast({
          title: "Document deleted",
          description: `${documentToDelete.title || documentToDelete.filename} has been deleted`
        });
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Could not delete the document",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) return;

    try {
      const result = await documentService.createNote(newNoteTitle, newNoteContent);
      
      if (result.success) {
        toast({
          title: "Note created",
          description: "Your note has been saved successfully"
        });
        
        // Add to cache if note data is available
        if (result.data?.note) {
          addDocument(result.data.note);
        }
        
        setNewNoteDialog(false);
        setNewNoteTitle("");
        setNewNoteContent("");
        
        // Force refresh to ensure we have the latest
        loadDocuments(true);
      } else {
        throw new Error(result.error || 'Failed to create note');
      }
    } catch (error: any) {
      toast({
        title: "Failed to create note",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  };

  const handleViewDocument = (document: Document) => {
    // Navigate to knowledge base or chat with this document
    navigate(`/knowledge?search=${encodeURIComponent(document.title || document.filename || '')}`);
  };

  const handleSearchDocuments = async () => {
    if (!searchQuery.trim()) {
      // No need to reload, just show all cached documents
      return;
    }

    try {
      const result = await documentService.searchDocuments(searchQuery, 'hybrid', 50);
      
      if (result.success && result.data) {
        // For search, we'll just navigate to knowledge page with the search
        navigate(`/knowledge?search=${encodeURIComponent(searchQuery)}`);
      }
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message || "Could not search documents",
        variant: "destructive"
      });
    }
  };

  // Filter and search logic using cached data
  const filteredDocuments = documents.filter(doc => {
    const matchesTab = currentTab === 'all' || doc.document_type === currentTab;
    const matchesType = filterType === 'all' || doc.document_type === filterType;
    const matchesStatus = filterStatus === 'all' || doc.processing_status === filterStatus;
    const matchesSearch = !searchQuery || 
      (doc.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.filename || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesType && matchesStatus && matchesSearch;
  });

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'audio': return <Mic className="w-4 h-4" />;
      case 'note': return <Edit3 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'processing': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'pending': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const removeFromQueue = (fileId: string) => {
    setUploadQueue(prev => prev.filter(item => item.id !== fileId));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Show loading only on initial load when no cached data
  if (documentsLoading && documents.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your documents...</p>
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
              Documents & Media
            </h1>
            <p className="text-muted-foreground">
              Manage your files, documents, recordings, and notes
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              disabled={documentsLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${documentsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={newNoteDialog} onOpenChange={setNewNoteDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit3 className="w-4 h-4 mr-2" />
                  New Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Note title"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                  />
                  <textarea
                    placeholder="Note content..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="w-full h-32 p-3 rounded-lg border border-border bg-muted/50 resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setNewNoteDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateNote} disabled={!newNoteTitle.trim()}>
                      Create Note
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Upload Zone */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-lg p-8 text-center transition-all duration-200 cursor-pointer hover:bg-muted/30"
            >
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Upload Documents & Media
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Drag & drop files here, or click to browse
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground mb-4">
                    <Badge variant="outline">PDF</Badge>
                    <Badge variant="outline">DOCX</Badge>
                    <Badge variant="outline">TXT</Badge>
                    <Badge variant="outline">MP3</Badge>
                    <Badge variant="outline">WAV</Badge>
                    <Badge variant="outline">M4A</Badge>
                  </div>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.mp3,.wav,.m4a,.ogg,.flac"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFileUpload(Array.from(e.target.files));
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button type="button" variant="outline" asChild>
                    <span>Choose Files</span>
                  </Button>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Queue */}
        {uploadQueue.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Upload Progress ({uploadQueue.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {uploadQueue.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3">
                    {getDocumentIcon(uploadFile.file.type.startsWith('audio/') ? 'audio' : 'pdf')}
                    <div>
                      <p className="font-medium text-sm">{uploadFile.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(uploadFile.file.size)} • {uploadFile.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${uploadFile.progress}%` }}
                      />
                    </div>
                    <Badge className={getStatusColor(uploadFile.status)}>
                      {uploadFile.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeFromQueue(uploadFile.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search documents, notes, and recordings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchDocuments()}
                  className="pl-10 bg-muted/50 border-border/50"
                />
              </div>
              
              <div className="flex gap-2">
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

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleSearchDocuments}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Tabs - Using cached data */}
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({documents.length})</TabsTrigger>
            <TabsTrigger value="pdf">Documents ({documents.filter(d => d.document_type === 'pdf').length})</TabsTrigger>
            <TabsTrigger value="audio">Audio ({documents.filter(d => d.document_type === 'audio').length})</TabsTrigger>
            <TabsTrigger value="note">Notes ({documents.filter(d => d.document_type === 'note').length})</TabsTrigger>
          </TabsList>

          <TabsContent value={currentTab} className="mt-6">
            {filteredDocuments.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-8 text-center">
                  <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {searchQuery ? 'No matches found' : 'No documents yet'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery 
                      ? 'Try adjusting your search terms or filters'
                      : 'Upload some files to get started with your knowledge base'
                    }
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => document.getElementById('file-upload')?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredDocuments.map((doc) => (
                  <Card key={doc.id} className="glass-card hover:glass-card-hover transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex-shrink-0 w-12 h-12 bg-muted/30 rounded-lg flex items-center justify-center">
                            {getDocumentIcon(doc.document_type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-foreground truncate">
                                {doc.title || doc.filename || 'Untitled'}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {doc.document_type.toUpperCase()}
                              </Badge>
                              {doc.processing_status && (
                                <Badge className={`text-xs ${getStatusColor(doc.processing_status)}`}>
                                  {doc.processing_status}
                                </Badge>
                              )}
                            </div>
                            
                            {(doc.description || doc.ocr_text) && (
                              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                                {doc.description || doc.ocr_text?.slice(0, 150) + (doc.ocr_text && doc.ocr_text.length > 150 ? '...' : '')}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(doc.created_at)}
                              </div>
                              {doc.file_size && (
                                <span>{formatFileSize(doc.file_size)}</span>
                              )}
                              {doc.metadata?.speaker && (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {doc.metadata.speaker}
                                </div>
                              )}
                              {doc.metadata?.duration && (
                                <span>{Math.round(doc.metadata.duration / 60)} min</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            {doc.document_type === 'note' && (
                              <DropdownMenuItem>
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteDocument(doc)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete "{documentToDelete?.title || documentToDelete?.filename}"
                and remove it from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Documents;