import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { documentService } from "@/services/documentService";

interface NoteCreatorProps {
  onClose: () => void;
}

const NoteCreator = ({ onClose }: NoteCreatorProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateNote = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for your note",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    try {
      const result = await documentService.createNote(title, description);
      
      if (result.success) {
        toast({
          title: "Note created successfully",
          description: "Your note has been saved to your knowledge base",
        });
        onClose();
      } else {
        throw new Error(result.error || 'Failed to create note');
      }
    } catch (error: any) {
      toast({
        title: "Failed to create note",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="note-title">Title</Label>
        <Input
          id="note-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter note title..."
        />
      </div>
      
      <div>
        <Label htmlFor="note-description">Content</Label>
        <Textarea
          id="note-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Write your note content here..."
          rows={6}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreateNote}
          disabled={isCreating}
        >
          {isCreating ? "Creating..." : "Create Note"}
        </Button>
      </div>
    </div>
  );
};

export default NoteCreator;