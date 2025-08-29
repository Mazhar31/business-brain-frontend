// src/services/gmailService.ts
import api from '../lib/api';

// Get base URL from the API configuration
const getBaseUrl = () => {
  return api.defaults.baseURL?.replace('/api/v1', '') || 'http://localhost:8000';
};

// Types matching backend API schemas
export interface Email {
  id: string;
  gmail_id: string;
  thread_id?: string;
  subject?: string;
  from_email?: string;
  to_email?: string;
  date?: string;
  readable_date?: string;
  snippet?: string;
  body_text?: string;
  body_html?: string;
  attachments: {
    filename: string;
    mime_type: string;
    size: number;
    attachment_id: string;
  }[];
  is_read: boolean;
  is_starred: boolean;
  size_estimate: number;
  created_at: string;
}

export interface EmailDetail extends Email {
  cc_email?: string;
  bcc_email?: string;
  headers: Record<string, any>;
  labels: string[];
}

export interface EmailListResponse {
  emails: Email[];
  total: number;
  unread_count: number;
}

export interface SyncResponse {
  message: string;
  synced_count: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class GmailService {
  debugger;
  // Start Gmail OAuth flow (redirects to Google)
  startAuth(email?: string): void {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      throw new Error('Please log in first');
    }
    
    const baseUrl = getBaseUrl();
    const url = email 
      ? `${baseUrl}/api/v1/gmail/auth?email=${encodeURIComponent(email)}`
      : `${baseUrl}/api/v1/gmail/auth`;
    
    // Create a form to send the token in the Authorization header via POST
    const form = document.createElement('form');
    form.method = 'GET';
    form.action = url;
    
    // Add token as a hidden input since we can't set headers in form submission
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'token';
    tokenInput.value = token;
    form.appendChild(tokenInput);
    
    if (email) {
      const emailInput = document.createElement('input');
      emailInput.type = 'hidden';
      emailInput.name = 'email';
      emailInput.value = email;
      form.appendChild(emailInput);
    }
    
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }

  // Check Gmail connection status
  async checkConnection(): Promise<ApiResponse<{ connected: boolean; email_address?: string; connected_at?: string }>> {
    try {
      const response = await api.get('/gmail/status');
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Connection check failed'
      };
    }
  }

  // Get user's emails
  async getEmails(params?: {
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<EmailListResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      
      const response = await api.get(`/gmail/emails?${queryParams}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Failed to get emails:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to fetch emails'
      };
    }
  }

  // Get email detail
  async getEmailDetail(emailId: string): Promise<ApiResponse<EmailDetail>> {
    try {
      const response = await api.get(`/gmail/emails/${emailId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Failed to get email detail:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to fetch email details'
      };
    }
  }



  // Toggle star on email
  async toggleStar(emailId: string): Promise<ApiResponse<{ starred: boolean; message: string }>> {
    try {
      const response = await api.post(`/gmail/emails/${emailId}/star`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Failed to toggle star:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to update email'
      };
    }
  }

  // Sync emails manually
  async syncEmails(maxResults?: number): Promise<ApiResponse<SyncResponse>> {
    try {
      const params = maxResults ? `?max_results=${maxResults}` : '';
      const response = await api.post(`/gmail/sync${params}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Failed to sync emails:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to sync emails'
      };
    }
  }



  // Start watching emails for push notifications
  async startWatch(): Promise<ApiResponse<{ status: string; expiration: string }>> {
    try {
      const response = await api.post('/gmail/watch');
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Failed to start watching emails:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to start watching'
      };
    }
  }

  // Disconnect Gmail account
  async disconnect(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.delete('/gmail/disconnect');
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to disconnect'
      };
    }
  }

  // Connect to WebSocket for real-time notifications
  connectWebSocket(userId: string, onMessage?: (data: any) => void): WebSocket | null {
    try {
      const wsUrl = `${getBaseUrl().replace('http', 'ws')}/api/v1/gmail/ws/${userId}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('Gmail WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Gmail notification:', data);
        
        if (onMessage) {
          onMessage(data);
        }
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('gmail:notification', {
          detail: data
        }));
      };
      
      ws.onclose = () => {
        console.log('Gmail WebSocket disconnected');
      };
      
      ws.onerror = (error) => {
        console.error('Gmail WebSocket error:', error);
      };
      
      return ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      return null;
    }
  }
}

export const gmailService = new GmailService();
export default gmailService;