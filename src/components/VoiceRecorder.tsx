import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Upload, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { documentService } from "@/services/documentService";

const VoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState("en");
  const [recordingTitle, setRecordingTitle] = useState("");
  const [description, setDescription] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Supported languages based on your backend
  const languages = [
    { code: "en", name: "English" },
    { code: "ar", name: "Arabic" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" }
  ];

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to use audio/wav first, fallback to audio/webm
      let mimeType = 'audio/wav';
      if (!MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/webm';
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording started",
        description: "Speak clearly for best transcription quality",
      });
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record audio",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const processRecording = async () => {
    if (!audioBlob || !recordingTitle.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a title for your recording",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Determine file extension based on blob type
      let extension = '.wav';
      let mimeType = 'audio/wav';
      
      if (audioBlob.type.includes('webm')) {
        // Convert webm to wav for backend compatibility
        extension = '.wav';
        mimeType = 'audio/wav';
      }
      
      // Create a file from the blob
      const audioFile = new File([audioBlob], `${recordingTitle}${extension}`, {
        type: mimeType
      });
      
      // Upload to your backend
      const result = await documentService.uploadAudio(
        audioFile,
        recordingTitle,
        description,
        language
      );

      if (result.success) {
        // Reset form
        setAudioBlob(null);
        setRecordingTime(0);
        setRecordingTitle("");
        setDescription("");
        
        toast({
          title: "Recording processed successfully",
          description: `Your ${formatTime(recordingTime)} recording has been transcribed and added to your knowledge base`,
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error: any) {
      console.error('Processing error:', error);
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process your recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const discardRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setRecordingTitle("");
    setDescription("");
    toast({
      title: "Recording discarded",
      description: "The recording has been deleted",
    });
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Voice Recorder
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!isRecording && !audioBlob && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Recording Title</Label>
              <Input 
                id="title"
                value={recordingTitle}
                onChange={(e) => setRecordingTitle(e.target.value)}
                placeholder="Team meeting, client call, etc."
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input 
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the recording..."
              />
            </div>
            
            <div>
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={startRecording} className="w-full" variant="ai">
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          </div>
        )}

        {isRecording && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              <span className="text-2xl font-mono font-bold">
                {formatTime(recordingTime)}
              </span>
            </div>
            
            <div className="flex justify-center space-x-2">
              {!isPaused ? (
                <Button onClick={pauseRecording} variant="outline">
                  <Pause className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={resumeRecording} variant="ai">
                  <Play className="w-4 h-4" />
                </Button>
              )}
              
              <Button onClick={stopRecording} variant="outline">
                <Square className="w-4 h-4" />
              </Button>
            </div>
            
            {isPaused && (
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500">
                Recording Paused
              </Badge>
            )}
          </div>
        )}

        {audioBlob && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <h3 className="font-semibold">{recordingTitle || "Untitled Recording"}</h3>
                <p className="text-sm text-muted-foreground">
                  Duration: {formatTime(recordingTime)}
                </p>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {languages.find(l => l.code === language)?.name}
                </span>
              </div>
            </div>
            
            <audio controls className="w-full">
              <source src={URL.createObjectURL(audioBlob)} type={audioBlob.type} />
            </audio>
            
            <div className="flex space-x-2">
              <Button 
                onClick={processRecording} 
                disabled={isProcessing}
                className="flex-1"
                variant="ai"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isProcessing ? "Processing..." : "Process & Save"}
              </Button>
              
              <Button 
                onClick={discardRecording}
                variant="outline"
              >
                Discard
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceRecorder;