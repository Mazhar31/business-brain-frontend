import { useState } from "react";
import { Brain, ArrowRight, CheckCircle, Upload, MessageSquare, Search, Zap, Sparkles, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-brain.jpg";

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Upload,
      title: "Capture Everything",
      description: "Upload documents, record conversations, or add quick notes - your AI assistant never forgets"
    },
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Discover hidden patterns and connections across all your company knowledge automatically"
    },
    {
      icon: MessageSquare,
      title: "Natural Conversations",
      description: "Ask questions in any language and get precise answers with source references"
    },
    {
      icon: Sparkles,
      title: "Smart Suggestions",
      description: "Get proactive insights and recommendations based on your knowledge patterns"
    }
  ];

  const benefits = [
    "Never lose important insights from meetings and conversations",
    "Find any information instantly with semantic search",
    "Get AI-powered summaries and action items automatically",
    "Scale your expertise across teams with intelligent knowledge sharing",
    "Make better decisions with instant access to company intelligence"
  ];

  // Smart navigation functions
  const handleSignIn = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/signup");
    }
  };

  const handleTalkToSales = () => {
    window.open("mailto:sales@businessbrain.com?subject=Business Brain Demo Request", "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-primary">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold text-foreground">
                Business Brain
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleSignIn}>
                {isAuthenticated ? "Dashboard" : "Sign In"}
              </Button>
              <Button variant="ai" onClick={handleGetStarted}>
                {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-slide-up">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Knowledge Intelligence
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
                  Clear your mind.
                  <br />
                  <span className="bg-gradient-primary bg-clip-text text-transparent">
                    Let AI remember.
                  </span>
                </h1>
                
                <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                  Transform every conversation, document, and idea into searchable company intelligence. 
                  Your AI-powered second brain that never forgets.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  variant="ai" 
                  onClick={handleGetStarted}
                  className="text-base px-8 py-6 group"
                >
                  {isAuthenticated ? "Go to Dashboard" : "Start Building Your Brain"}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="glass" 
                  onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-base px-8 py-6"
                >
                  <Brain className="w-5 h-5 mr-2" />
                  See How It Works
                </Button>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  Free to start
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  No training required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  Instant setup
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in">
              <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-20" />
              <img 
                src={heroImage} 
                alt="Business Brain AI Platform" 
                className="relative rounded-3xl shadow-2xl border border-border/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <Brain className="w-4 h-4" />
              Intelligent Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
              Your AI-powered knowledge companion
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Effortlessly capture, understand, and retrieve any information with AI that learns how you work
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="glass-card text-center group hover:scale-105 transition-all duration-300 border-border/30">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto group-hover:animate-pulse-glow transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo-section" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
                  Ask anything, get instant answers
                </h2>
                <p className="text-xl text-muted-foreground">
                  Your Business Brain understands context and finds exactly what you need from across all your company knowledge.
                </p>
              </div>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button variant="ai" size="lg" onClick={handleGetStarted} className="px-8 group">
                {isAuthenticated ? "Go to Dashboard" : "Experience the Intelligence"}
                <Brain className="w-5 h-5 ml-2 group-hover:animate-pulse" />
              </Button>
            </div>

            <div className="relative">
              <Card className="glass-card p-8 border-border/30">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-medium text-foreground">Ask Business Brain</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-primary/10 rounded-2xl p-4 text-sm">
                      "What pricing concerns came up in customer interviews?"
                    </div>
                    <div className="bg-muted/50 rounded-2xl p-4 text-sm space-y-3">
                      <p>Based on 3 recent customer interviews, pricing is mentioned as a key concern:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• TechCorp: "Budget approval process concern"</li>
                        <li>• StartupXYZ: "ROI demonstration needed"</li>
                        <li>• Enterprise Co: "Volume discount inquiry"</li>
                      </ul>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Brain className="w-3 h-3" />
                        Sources: 3 documents • 94% confidence
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="grid grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-foreground">10x</div>
              <div className="text-sm text-muted-foreground">Faster information retrieval</div>
            </div>
            <div className="space-y-2">  
              <div className="text-3xl font-bold text-foreground">95%</div>
              <div className="text-sm text-muted-foreground">Knowledge retention</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-foreground">0</div>
              <div className="text-sm text-muted-foreground">Lost insights</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Ready to build your Business Brain?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join forward-thinking teams who never lose valuable knowledge again.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="ai" 
              onClick={handleGetStarted}
              className="text-base px-8 py-6 group"
            >
              {isAuthenticated ? "Go to Dashboard" : "Start Your Free Brain"}
              <Sparkles className="w-5 h-5 ml-2 group-hover:animate-pulse" />
            </Button>
            <Button 
              size="lg" 
              variant="glass" 
              onClick={handleTalkToSales}
              className="text-base px-8 py-6"
            >
              <Users className="w-5 h-5 mr-2" />
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded bg-gradient-primary">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-foreground">
                Business Brain
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Business Brain. Never forget. Always understand.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;