
import { useState } from "react";
import { Eye, Download, Edit, Trash2, FileText, Clock, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Document } from "@/types/documents";

interface DocumentViewerProps {
  document: Document;
  onEdit?: (document: Document) => void;
  onDelete?: (documentId: string) => void;
}

const DocumentViewer = ({ document, onEdit, onDelete }: DocumentViewerProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(document.content);

  const handleSave = () => {
    if (onEdit) {
      onEdit({ ...document, content: editedContent });
    }
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'processing':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Card className="glass-card hover:bg-card/60 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {document.title}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
              {document.metadata.speaker && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {document.metadata.speaker}
                </div>
              )}
              {document.metadata.date && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(document.metadata.date).toLocaleDateString()}
                </div>
              )}
              <Badge variant="outline" className="text-xs">
                {formatFileSize(document.metadata.file_size)}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`text-xs ${getStatusColor(document.processing_status)}`}
            >
              {document.processing_status}
            </Badge>
            
            <div className="flex gap-1">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>{document.title}</DialogTitle>
                  </DialogHeader>
                  <div className="overflow-y-auto max-h-[60vh] p-4 bg-muted/30 rounded-lg">
                    {isEditing ? (
                      <div className="space-y-4">
                        <Textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="min-h-[400px] bg-background"
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleSave} size="sm">
                            Save Changes
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEditing(false)} 
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm text-foreground">
                        {document.content}
                      </div>
                    )}
                  </div>
                  {!isEditing && onEdit && (
                    <div className="flex justify-end">
                      <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Content
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onDelete(document.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm line-clamp-3">
          {document.content.substring(0, 200)}...
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Tag className="w-3 h-3 mr-1" />
              {document.metadata.file_type}
            </Badge>
            {document.embeddings_generated && (
              <Badge variant="outline" className="text-xs text-green-600">
                AI Ready
              </Badge>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            {new Date(document.created_at).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentViewer;
