// src/types/documents.ts

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface Document {
  id: string;
  org_id?: string;
  user_id: string;
  title: string;
  document_type: 'pdf' | 'note' | 'audio';
  filename?: string;
  file_path?: string;
  file_size?: number;
  content_type?: string;
  content?: string;
  ocr_text?: string;
  description?: string;
  source_url?: string;
  metadata?: {
    speaker?: string;
    date?: string;
    file_type?: string;
    language?: string;
    duration?: number;
  };
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  ocr_status?: 'pending' | 'processing' | 'completed' | 'failed';
  transcription_status?: 'pending' | 'processing' | 'completed' | 'failed';
  embeddings_generated?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchResponse {
  query: string;
  search_type: string;
  documents_found: number;
  relevant_documents: Array<{
    id: string;
    title: string;
    document_type: string;
    filename?: string;
    semantic_score?: number;
    keyword_score?: number;
    combined_score?: number;
    search_type?: string;
    preview: string;
  }>;
  ai_response?: string;
}