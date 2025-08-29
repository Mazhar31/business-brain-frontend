import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Brain, 
  Menu, 
  X, 
  Home, 
  Inbox as InboxIcon, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext"; // Import AuthContext
import TopHeader from "@/components/TopHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth(); // Use AuthContext for logout and user data

  const handleLogout = () => {
    logout(); // This will clear tokens and redirect to login
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Knowledge", href: "/knowledge", icon: Brain },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Inbox", href: "/inbox", icon: InboxIcon },
    { name: "Integrations", href: "/integrations", icon: Settings },
    // Only show admin routes if user exists and has admin role
    ...(user?.email?.includes("admin") ? [
      { name: "Team", href: "/team", icon: Users },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
    ] : []),
  ];

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  // Get display name
  const getDisplayName = () => {
    return user?.full_name || user?.email?.split('@')[0] || 'User';
  };

  // Get user role (simplified)
  const getUserRole = () => {
    return user?.email?.includes('admin') ? 'admin' : 'user';
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card/50 backdrop-blur-xl border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 px-6 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-primary">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-display font-semibold text-foreground">
              Business Brain
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.href);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200"
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </button>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border flex-shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {getUserRole()}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline" 
              size="sm" 
              className="w-full text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile header */}
        <div className="flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:hidden flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <span className="font-display font-semibold text-foreground">
              Business Brain
            </span>
          </div>
        </div>

        {/* Top Header Widgets - Fixed at top */}
        <div className="bg-background border-b border-border flex-shrink-0">
          <div className="p-4 lg:p-6">
            <TopHeader />
          </div>
        </div>

        {/* Page content - Scrollable */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;