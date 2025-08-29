// src/services/documentService.ts
import api from '../lib/api';

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
  content?: string; // For backward compatibility with DocumentViewer
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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper function to normalize documents from different endpoints
const normalizeDocument = (doc: any): Document => {
  return {
    id: doc.id,
    org_id: doc.org_id || 'default',
    user_id: doc.user_id,
    title: doc.title || doc.filename || 'Untitled',
    document_type: doc.document_type,
    filename: doc.filename,
    file_path: doc.file_path,
    file_size: doc.file_size,
    content_type: doc.content_type,
    content: doc.ocr_text || doc.description, // Map content for DocumentViewer
    ocr_text: doc.ocr_text,
    description: doc.description,
    source_url: doc.source_url || 'uploaded',
    metadata: {
      speaker: doc.metadata?.speaker,
      date: doc.created_at ? doc.created_at.split('T')[0] : undefined,
      file_type: doc.content_type || doc.document_type?.toUpperCase(),
      language: doc.metadata?.language || 'en',
      duration: doc.metadata?.duration,
    },
    processing_status: doc.processing_status || doc.ocr_status || doc.transcription_status || 'completed',
    ocr_status: doc.ocr_status,
    transcription_status: doc.transcription_status,
    embeddings_generated: doc.embeddings_generated || true,
    created_at: doc.created_at,
    updated_at: doc.updated_at
  };
};

export const documentService = {
  // Get all documents (PDFs only)
  getAllDocuments: async (): Promise<ApiResponse<Document[]>> => {
    try {
      const response = await api.get('/documents/');
      const documents = response.data.documents || [];
      const pdfDocuments = documents
        .filter((doc: any) => doc.document_type === 'pdf')
        .map(normalizeDocument);
      return { success: true, data: pdfDocuments };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch documents'
      };
    }
  },

  // Get all notes
  getAllNotes: async (): Promise<ApiResponse<Document[]>> => {
    try {
      const response = await api.get('/notes/');
      const notes = (response.data.notes || []).map((note: any) => normalizeDocument({
        ...note,
        document_type: 'note'
      }));
      return { success: true, data: notes };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch notes'
      };
    }
  },

  // Get all audio recordings
  getAllAudio: async (): Promise<ApiResponse<Document[]>> => {
    try {
      const response = await api.get('/audio/');
      const audio = (response.data.recordings || []).map((recording: any) => normalizeDocument({
        ...recording,
        document_type: 'audio'
      }));
      return { success: true, data: audio };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch audio recordings'
      };
    }
  },

  // Get all items by type (combined)
  getAllItemsByType: async (): Promise<ApiResponse<{
    documents: Document[];
    notes: Document[];
    audio: Document[];
  }>> => {
    try {
      const [documentsResponse, notesResponse, audioResponse] = await Promise.all([
        api.get('/documents/'),
        api.get('/notes/'),
        api.get('/audio/')
      ]);

      const allDocumentItems = documentsResponse.data.documents || [];
      const documents = allDocumentItems
        .filter((item: any) => item.document_type === 'pdf')
        .map(normalizeDocument);
      
      const notes = (notesResponse.data.notes || []).map((note: any) => normalizeDocument({
        ...note,
        document_type: 'note'
      }));
      
      const audio = (audioResponse.data.recordings || []).map((recording: any) => normalizeDocument({
        ...recording,
        document_type: 'audio'
      }));

      return {
        success: true,
        data: { documents, notes, audio }
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to fetch items by type'
      };
    }
  },

  // Get dashboard stats
  getDashboardStats: async (): Promise<ApiResponse<{
    stats: {
      totalDocuments: number;
      totalNotes: number;
      totalAudio: number;
      totalItems: number;
    };
    recentActivity: Array<Document & { type: string; name: string; status: string }>;
    documents: Document[];
    notes: Document[];
    audio: Document[];
  }>> => {
    try {
      const result = await documentService.getAllItemsByType();
      
      if (!result.success || !result.data) {
        return result as any;
      }

      const { documents, notes, audio } = result.data;

      const stats = {
        totalDocuments: documents.length,
        totalNotes: notes.length,
        totalAudio: audio.length,
        totalItems: documents.length + notes.length + audio.length
      };

      // Create recent activity
      const allItems = [
        ...documents.map(doc => ({
          ...doc,
          type: 'document',
          name: doc.title || doc.filename || 'Untitled',
          status: doc.ocr_status || 'completed'
        })),
        ...notes.map(note => ({
          ...note,
          type: 'note',
          name: note.title || 'Untitled',
          status: 'completed'
        })),
        ...audio.map(recording => ({
          ...recording,
          type: 'audio',
          name: recording.title || 'Untitled',
          status: recording.transcription_status || 'completed'
        }))
      ];

      const recentActivity = allItems
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      return {
        success: true,
        data: {
          stats,
          recentActivity,
          documents,
          notes,
          audio
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to fetch dashboard data'
      };
    }
  },

  // Upload document
  uploadDocument: async (files: File[]): Promise<ApiResponse<{ message: string; documents: Document[]; total_uploaded: number }>> => {
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Document upload failed'
      };
    }
  },

  // Create note
  createNote: async (title: string, description: string): Promise<ApiResponse<{ message: string; note: Document }>> => {
    try {
      const response = await api.post('/notes/', {
        title,
        description
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Note creation failed'
      };
    }
  },

  // Upload audio
  uploadAudio: async (file: File, title: string, description?: string, language = 'en'): Promise<ApiResponse<{ message: string; audio: Document }>> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      if (description) formData.append('description', description);
      formData.append('language', language);

      const response = await api.post('/audio/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Audio upload failed'
      };
    }
  },

  // Search documents
  searchDocuments: async (query: string, searchType: 'semantic' | 'keyword' | 'hybrid' = 'hybrid', limit = 10): Promise<ApiResponse<SearchResponse>> => {
    try {
      const response = await api.post('/documents/search', {
        query,
        search_type: searchType,
        limit
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Search failed'
      };
    }
  },

  // Delete document
  deleteDocument: async (documentId: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.delete(`/documents/${documentId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to delete document'
      };
    }
  },

  // Delete note
  deleteNote: async (noteId: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.delete(`/notes/${noteId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to delete note'
      };
    }
  },

  // Delete audio
  deleteAudio: async (audioId: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.delete(`/audio/${audioId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to delete audio'
      };
    }
  },

  // Update note
  updateNote: async (noteId: string, title: string, description: string): Promise<ApiResponse<{ message: string; note: Document }>> => {
    try {
      const response = await api.put(`/notes/${noteId}`, {
        title,
        description
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update note'
      };
    }
  }
};

// DO NOT add any default export here - use named exports only