
import { useState, useRef, useEffect } from "react";
import { Search, Sparkles, Mic, Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SearchSuggestion {
  id: string;
  type: 'document' | 'conversation' | 'insight' | 'action';
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<any>;
}

interface SmartSearchBarProps {
  onSearch: (query: string) => void;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  showVoiceButton?: boolean;
}

const SmartSearchBar = ({ 
  onSearch, 
  onSuggestionSelect, 
  placeholder = "Ask your Business Brain anything...",
  showVoiceButton = true 
}: SmartSearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock suggestions - in real app, these would come from API
  const mockSuggestions: SearchSuggestion[] = [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 0) {
      // Filter suggestions based on query
      const filtered = mockSuggestions.filter(s => 
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.subtitle?.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions(mockSuggestions.slice(0, 4));
    }
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setIsActive(false);
    }
  };

  const handleFocus = () => {
    setIsActive(true);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSuggestionSelect(suggestion);
    setQuery(suggestion.title);
    setIsActive(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'insight': return <Sparkles className="w-4 h-4 text-primary" />;
      case 'action': return <Command className="w-4 h-4 text-accent" />;
      default: return <Search className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      document: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      conversation: "bg-green-500/10 text-green-500 border-green-500/20", 
      insight: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      action: "bg-orange-500/10 text-orange-500 border-orange-500/20"
    };
    
    return (
      <Badge variant="outline" className={`text-xs ${colors[type as keyof typeof colors]}`}>
        {type}
      </Badge>
    );
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            placeholder={placeholder}
            className={`pl-12 pr-16 h-14 text-lg bg-muted/30 border-border/50 rounded-2xl transition-all duration-300 ${
              isActive ? 'bg-background border-primary/50 shadow-lg shadow-primary/10' : 'hover:bg-muted/50'
            }`}
          />
          {showVoiceButton && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-xl hover:bg-primary/10"
            >
              <Mic className="w-4 h-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Search Suggestions Dropdown */}
      {isActive && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 glass-card border-border/50 shadow-xl">
          <CardContent className="p-2">
            <div className="space-y-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 rounded-lg transition-colors group"
                >
                  {getTypeIcon(suggestion.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {suggestion.title}
                    </p>
                    {suggestion.subtitle && (
                      <p className="text-sm text-muted-foreground">
                        {suggestion.subtitle}
                      </p>
                    )}
                  </div>
                  {getTypeBadge(suggestion.type)}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartSearchBar;
