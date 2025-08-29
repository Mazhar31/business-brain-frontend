
export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  org_id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  avatar_url?: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  org_id: string;
  role: 'owner' | 'admin' | 'member';
  preferences: {
    language: string;
    notifications: boolean;
  };
  created_at: string;
}

export interface MeetingSource {
  id: string;
  org_id: string;
  type: 'fathom' | 'otter' | 'zoom' | 'teams' | 'gmail';
  config: {
    email?: string;
    webhook_url?: string;
    api_key?: string;
  };
  status: 'active' | 'inactive' | 'error';
  last_sync: string;
}

export interface Document {
  id: string;
  org_id: string;
  user_id: string;
  title: string;
  content?: string;
  file_path?: string;
  file_type: string;
  file_size?: number;
  source_url?: string;
  metadata: Record<string, any>;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  embeddings_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface Embedding {
  id: string;
  document_id: string;
  chunk_text: string;
  vector: number[];
  metadata: {
    chunk_index: number;
    source_page?: number;
    confidence: number;
  };
}

export interface ChatSession {
  id: string;
  user_id: string;
  org_id: string;
  title: string;
  messages: ChatMessage[];
  context_settings: {
    sources: string[];
    language: string;
    max_context: number;
  };
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: DocumentSource[];
  language?: string;
  timestamp: string;
}

export interface DocumentSource {
  document_id: string;
  title: string;
  excerpt: string;
  confidence: number;
  metadata: {
    speaker?: string;
    date?: string;
    page?: number;
  };
}

export interface Integration {
  id: string;
  org_id: string;
  type: 'hubspot' | 'gmail' | 'slack' | 'teams';
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, any>;
  last_sync: string;
}
