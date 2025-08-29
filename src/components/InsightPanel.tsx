
import { Brain, TrendingUp, Clock, Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Insight {
  id: string;
  type: 'trend' | 'connection' | 'summary' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  relatedDocuments: string[];
  timestamp: string;
}

interface InsightPanelProps {
  insights: Insight[];
  onInsightClick: (insight: Insight) => void;
  onViewAll: () => void;
}

const InsightPanel = ({ insights, onInsightClick, onViewAll }: InsightPanelProps) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'connection': return <Users className="w-4 h-4 text-green-500" />;
      case 'summary': return <Brain className="w-4 h-4 text-purple-500" />;
      case 'recommendation': return <ArrowRight className="w-4 h-4 text-orange-500" />;
      default: return <Brain className="w-4 h-4 text-primary" />;
    }
  };

  const getInsightColor = (type: string) => {
    const colors = {
      trend: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      connection: "bg-green-500/10 text-green-500 border-green-500/20",
      summary: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      recommendation: "bg-orange-500/10 text-orange-500 border-orange-500/20"
    };
    return colors[type as keyof typeof colors];
  };

  const mockInsights: Insight[] = [
    {
      id: "1",
      type: "trend",
      title: "Pricing Concerns Increasing",
      description: "Multiple customer conversations mention pricing as a key concern. Consider addressing this in upcoming materials.",
      confidence: 0.89,
      relatedDocuments: ["TechCorp Interview", "Q4 Strategy Meeting"],
      timestamp: "2 hours ago"
    },
    {
      id: "2", 
      type: "connection",
      title: "Product-Market Fit Pattern",
      description: "Similar challenges mentioned across 3 customer interviews suggest a product-market fit opportunity.",
      confidence: 0.94,
      relatedDocuments: ["Customer Interview A", "Customer Interview B", "Market Analysis"],
      timestamp: "5 hours ago"
    },
    {
      id: "3",
      type: "summary",
      title: "Weekly Knowledge Summary",
      description: "This week's uploads contain 12 new insights about customer development priorities and competitive positioning.",
      confidence: 0.87,
      relatedDocuments: ["5 documents"],
      timestamp: "1 day ago"
    }
  ];

  const displayInsights = insights.length > 0 ? insights : mockInsights;

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="w-5 h-5 text-primary brain-glow" />
            AI Insights
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {displayInsights.slice(0, 3).map((insight) => (
          <div
            key={insight.id}
            onClick={() => onInsightClick(insight)}
            className="p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group border border-border/30"
          >
            <div className="flex items-start gap-3">
              {getInsightIcon(insight.type)}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {insight.title}
                  </h4>
                  <Badge variant="outline" className={`text-xs ${getInsightColor(insight.type)}`}>
                    {insight.type}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insight.description}
                </p>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {insight.timestamp}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(insight.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  
                  <span className="text-muted-foreground">
                    {insight.relatedDocuments.length} sources
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {displayInsights.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No insights available yet</p>
            <p className="text-sm">Upload documents to get AI-powered insights</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InsightPanel;
