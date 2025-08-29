// src/App.tsx - Updated with Signup route
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { GmailProvider } from "@/contexts/GmailContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Import your existing components
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup"; // NEW
import Dashboard from "@/pages/Dashboard";
import Inbox from "@/pages/Inbox";
import Knowledge from "@/pages/Knowledge";
import Integrations from "@/pages/Integrations";
import NotFound from "@/pages/NotFound";


// Import the new integrated chat component
import IntegratedChat from "@/components/IntegratedChat";

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <GmailProvider>
          <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/inbox" element={
                <ProtectedRoute>
                  <Inbox />
                </ProtectedRoute>
              } />
              
              <Route path="/knowledge" element={
                <ProtectedRoute>
                  <Knowledge />
                </ProtectedRoute>
              } />
              
              <Route path="/integrations" element={
                <ProtectedRoute>
                  <Integrations />
                </ProtectedRoute>
              } />
              
              {/* Chat routes */}
              <Route path="/chat" element={
                <ProtectedRoute>
                  <IntegratedChat />
                </ProtectedRoute>
              } />
              
              <Route path="/chat/:conversationId" element={
                <ProtectedRoute>
                  <IntegratedChat />
                </ProtectedRoute>
              } />
              
              {/* Redirect old routes if they exist */}
              <Route path="/enhanced-chat" element={<Navigate to="/chat" replace />} />
              <Route path="/documents" element={<Navigate to="/inbox" replace />} />
              
              {/* 404 fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            <Toaster />
          </div>
        </Router>
        </GmailProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;