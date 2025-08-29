
import { useState } from "react";
import { X, Mic, Upload, Type, Sparkles, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HandwritingCanvas } from "./HandwritingCanvas";
import { useCapacitor } from "@/hooks/useCapacitor";

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { type: string; title: string; content: string; file?: File; handwritingImage?: string }) => void;
}

const QuickCaptureModal = ({ isOpen, onClose, onSave }: QuickCaptureModalProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [handwritingImage, setHandwritingImage] = useState<string | null>(null);
  const { isNative } = useCapacitor();

  if (!isOpen) return null;

  const handleSave = (type: string) => {
    if (!title.trim() && !content.trim() && !selectedFile && !handwritingImage) return;
    
    onSave({
      type,
      title: title || `${type} - ${new Date().toLocaleDateString()}`,
      content,
      file: selectedFile || undefined,
      handwritingImage: handwritingImage || undefined
    });
    
    // Reset form
    setTitle("");
    setContent("");
    setSelectedFile(null);
    setHandwritingImage(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    // Implement recording logic
    setTimeout(() => {
      setIsRecording(false);
      setTitle("Voice Recording - " + new Date().toLocaleTimeString());
    }, 3000);
  };

  const handleHandwritingText = (extractedText: string) => {
    setContent(prev => prev + (prev ? '\n\n' : '') + extractedText);
    if (!title) {
      setTitle('Handwritten Note');
    }
  };

  const handleHandwritingImage = (imageData: string) => {
    setHandwritingImage(imageData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl glass-card border-border/50 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Quick Capture
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Tabs defaultValue="note" className="w-full">
            <TabsList className={`grid w-full ${isNative ? 'grid-cols-4' : 'grid-cols-3'} bg-muted/50`}>
              <TabsTrigger value="note" className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Note
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Voice
              </TabsTrigger>
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                File
              </TabsTrigger>
              {isNative && (
                <TabsTrigger value="handwriting" className="flex items-center gap-2">
                  <PenTool className="w-4 h-4" />
                  Draw
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="note" className="space-y-4">
              <Input
                placeholder="Give your note a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-muted/50 border-border/50"
              />
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="bg-muted/50 border-border/50 resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  variant="ai" 
                  onClick={() => handleSave('note')}
                  disabled={!title.trim() && !content.trim()}
                >
                  Save Note
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="voice" className="space-y-4">
              <div className="text-center py-8">
                {isRecording ? (
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <Mic className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-muted-foreground">Recording in progress...</p>
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                      00:03
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button
                      size="lg"
                      variant="ai"
                      onClick={startRecording}
                      className="w-20 h-20 rounded-full"
                    >
                      <Mic className="w-8 h-8" />
                    </Button>
                    <p className="text-muted-foreground">Click to start recording</p>
                    {title && (
                      <Input
                        placeholder="Recording title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-muted/50 border-border/50"
                      />
                    )}
                  </div>
                )}
              </div>
              {title && !isRecording && (
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    variant="ai" 
                    onClick={() => handleSave('voice')}
                  >
                    Save Recording
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="file" className="space-y-4">
              <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.mp3,.wav,.mp4"
                />
                <label htmlFor="file-upload" className="cursor-pointer space-y-2">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">
                    Drop files here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Support: PDF, DOC, TXT, MP3, WAV, MP4
                  </p>
                </label>
              </div>
              
              {selectedFile && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Upload className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <Input
                    placeholder="File title (optional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-muted/50 border-border/50"
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button 
                      variant="ai" 
                      onClick={() => handleSave('file')}
                    >
                      Upload File
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {isNative && (
              <TabsContent value="handwriting" className="space-y-4">
                <Input
                  placeholder="Note title (optional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-muted/50 border-border/50"
                />
                
                <HandwritingCanvas
                  onTextExtracted={handleHandwritingText}
                  onImageSaved={handleHandwritingImage}
                  className="min-h-[300px]"
                />
                
                {content && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Extracted Text:</label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="bg-muted/50 border-border/50 min-h-[100px]"
                      placeholder="Extracted text will appear here..."
                    />
                  </div>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    variant="ai" 
                    onClick={() => handleSave('handwriting')}
                    disabled={!content && !handwritingImage}
                  >
                    Save Handwriting
                  </Button>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickCaptureModal;
