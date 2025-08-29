
import { useState } from "react";
import { MoreHorizontal, ExternalLink, Star, Clock, User, Tag } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface KnowledgeCardProps {
  id: string;
  title: string;
  content: string;
  type: 'document' | 'conversation' | 'insight' | 'recording';
  metadata: {
    speaker?: string;
    date: string;
    source?: string;
    tags?: string[];
    confidence?: number;
  };
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
}

const KnowledgeCard = ({
  id,
  title,
  content,
  type,
  metadata,
  onOpen,
  onEdit,
  onDelete,
  onFavorite,
  isFavorited = false
}: KnowledgeCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getTypeColor = (type: string) => {
    const colors = {
      document: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      conversation: "bg-green-500/10 text-green-500 border-green-500/20",
      insight: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      recording: "bg-orange-500/10 text-orange-500 border-orange-500/20"
    };
    return colors[type as keyof typeof colors];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return "📄";
      case 'conversation': return "💬";
      case 'insight': return "💡";
      case 'recording': return "🎙️";
      default: return "📋";
    }
  };

  const truncatedContent = content.length > 150 
    ? content.substring(0, 150) + "..." 
    : content;

  return (
    <Card 
      className="glass-card hover:bg-card/60 transition-all duration-300 cursor-pointer group border-border/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onOpen}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-lg">{getTypeIcon(type)}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs ${getTypeColor(type)}`}>
                  {type}
                </Badge>
                {metadata.confidence && (
                  <Badge variant="outline" className="text-xs">
                    {Math.round(metadata.confidence * 100)}% match
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className={`flex items-center gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            {onFavorite && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite();
                }}
                className="h-8 w-8 p-0"
              >
                <Star className={`w-4 h-4 ${isFavorited ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8 p-0"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen(); }}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm leading-relaxed">
          {truncatedContent}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {metadata.speaker && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {metadata.speaker}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {metadata.date}
            </div>
            {metadata.source && (
              <Badge variant="outline" className="text-xs">
                {metadata.source}
              </Badge>
            )}
          </div>
        </div>

        {metadata.tags && metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {metadata.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="w-2 h-2 mr-1" />
                {tag}
              </Badge>
            ))}
            {metadata.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{metadata.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KnowledgeCard;
