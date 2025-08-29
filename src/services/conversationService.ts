// src/services/conversationService.ts
import api from '../lib/api';

// Types based on your backend API schemas
export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message?: string;
  last_message_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  metadata?: {
    search_results?: any;
    sources?: any[];
  };
}

export interface MessageSendRequest {
  content: string;
  search_type?: 'semantic' | 'keyword' | 'hybrid';
  max_results?: number;
}

export interface ChatResponse {
  conversation: Conversation;
  user_message: Message;
  assistant_message: Message;
  search_results: any;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ConversationService {
  // Get all conversations for current user
  async getConversations(): Promise<ApiResponse<ConversationListResponse>> {
    try {
      const response = await api.get('/conversations/');
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Failed to get conversations:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to fetch conversations'
      };
    }
  }

  // Create a new conversation
  async createConversation(title?: string): Promise<ApiResponse<{ conversation: Conversation; message: string }>> {
    try {
      const response = await api.post('/conversations/', {
        title: title || undefined
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Failed to create conversation:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to create conversation'
      };
    }
  }

  // Get specific conversation
  async getConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    try {
      const response = await api.get(`/conversations/${conversationId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Failed to get conversation:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to fetch conversation'
      };
    }
  }

  // Update conversation title
  async updateConversation(conversationId: string, title: string): Promise<ApiResponse<{ conversation: Conversation; message: string }>> {
    try {
      const response = await api.put(`/conversations/${conversationId}`, {
        title
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Failed to update conversation:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to update conversation'
      };
    }
  }

  // Delete conversation
  async deleteConversation(conversationId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.delete(`/conversations/${conversationId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Failed to delete conversation:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to delete conversation'
      };
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId: string): Promise<ApiResponse<MessageListResponse>> {
    try {
      const response = await api.get(`/conversations/${conversationId}/messages`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Failed to get messages:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to fetch messages'
      };
    }
  }

  // Send message to conversation
  async sendMessage(conversationId: string, messageRequest: MessageSendRequest): Promise<ApiResponse<ChatResponse>> {
    try {
      const response = await api.post(`/conversations/${conversationId}/messages`, messageRequest);
      return {
        success: true,
        data: response.data.data // API returns { message: "success", data: ChatResponse }
      };
    } catch (error: any) {
      console.error('Failed to send message:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to send message'
      };
    }
  }

  // Quick chat - create conversation and send first message in one request
  async quickChat(messageRequest: MessageSendRequest): Promise<ApiResponse<ChatResponse>> {
    try {
      const response = await api.post('/conversations/quick-chat', messageRequest);
      return {
        success: true,
        data: response.data.data // API returns { message: "success", data: ChatResponse }
      };
    } catch (error: any) {
      console.error('Failed to quick chat:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to start chat'
      };
    }
  }

  // Delete specific message
  async deleteMessage(messageId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.delete(`/conversations/messages/${messageId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Failed to delete message:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to delete message'
      };
    }
  }

  // Helper function to format date for display
  formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    
    // Same day
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    // This week
    const daysDiff = Math.floor(diffInSeconds / 86400);
    if (daysDiff === 1) return 'Yesterday';
    if (daysDiff < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Older
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  }

  // Helper to truncate conversation title
  truncateTitle(title: string, maxLength: number = 50): string {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  }
}

export const conversationService = new ConversationService();