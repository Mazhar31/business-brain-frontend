import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { documentService } from "@/services/documentService";

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

interface FileUploaderProps {
  onUpload: (files: File[]) => void;
  uploadQueue: UploadFile[];
  onRemoveFile: (fileId: string) => void;
}

const FileUploader = ({ onUpload, uploadQueue, onRemoveFile }: FileUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  // Accepted file types based on your backend
  const acceptedFileTypes = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'audio/mpeg': ['.mp3'],
    'audio/wav': ['.wav'],
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setDragActive(false);
    
    // Add files to upload queue immediately
    onUpload(acceptedFiles);
    
    // Process each file
    for (const file of acceptedFiles) {
      try {
        // Determine upload type based on file type
        if (file.type === 'application/pdf') {
          // Upload PDF document
          const result = await documentService.uploadDocument([file]);
          
          if (result.success) {
            toast({
              title: "Document uploaded successfully",
              description: `${file.name} is being processed and will be available for search soon.`
            });
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } else if (file.type.startsWith('audio/')) {
          // Upload audio file - need title
          const title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
          const result = await documentService.uploadAudio(file, title, '', 'en');
          
          if (result.success) {
            toast({
              title: "Audio uploaded successfully",
              description: `${file.name} is being transcribed and will be available for search soon.`
            });
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } else {
          // For other file types, try document upload
          const result = await documentService.uploadDocument([file]);
          
          if (result.success) {
            toast({
              title: "File uploaded successfully",
              description: `${file.name} is being processed and will be available for search soon.`
            });
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        }
        
      } catch (error: any) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}: ${error.message}`,
          variant: "destructive"
        });
      }
    }
  }, [onUpload, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    multiple: true,
    maxSize: 25 * 1024 * 1024, // 25MB to match your backend limits
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default:
        return <File className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      uploading: "default",
      processing: "default",
      completed: "secondary",
      failed: "destructive",
    };
    return variants[status] || "outline";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card className="glass-card">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
              isDragActive || dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="w-12 h-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Upload Documents & Media
                </h3>
                <p className="text-muted-foreground mb-4">
                  Drag & drop files here, or click to browse
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">PDF</Badge>
                  <Badge variant="outline">DOCX</Badge>
                  <Badge variant="outline">TXT</Badge>
                  <Badge variant="outline">MP3</Badge>
                  <Badge variant="outline">WAV</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Maximum file size: 25MB • Audio: MP3, WAV only
                </p>
              </div>
              <Button type="button" variant="outline">
                Choose Files
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Upload Queue ({uploadQueue.length})
            </h3>
            <div className="space-y-3">
              {uploadQueue.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg"
                >
                  {getStatusIcon(uploadFile.status)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {uploadFile.file.name}
                      </p>
                      <Badge variant={getStatusBadge(uploadFile.status)} className="text-xs">
                        {uploadFile.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(uploadFile.file.size)}</span>
                      <span>•</span>
                      <span>{uploadFile.file.type || 'Unknown type'}</span>
                    </div>

                    {uploadFile.status === 'uploading' || uploadFile.status === 'processing' ? (
                      <Progress value={uploadFile.progress} className="mt-2 h-1" />
                    ) : null}

                    {uploadFile.error && (
                      <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                    )}
                  </div>

                  {(uploadFile.status === 'pending' || uploadFile.status === 'failed') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFile(uploadFile.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUploader;