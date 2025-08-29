// src/contexts/DataContext.tsx - Enhanced with better caching for Dashboard
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { documentService, Document } from '@/services/documentService';
import { conversationService, Conversation } from '@/services/conversationService';

interface DataState {
  // Documents data
  documents: Document[];
  conversations: Conversation[];
  
  // Loading states
  documentsLoading: boolean;
  conversationsLoading: boolean;
  
  // Last fetch timestamps for cache invalidation
  documentsLastFetch: number | null;
  conversationsLastFetch: number | null;
  
  // Error states
  documentsError: string | null;
  conversationsError: string | null;
  
  // Computed stats (cached)
  stats: {
    totalDocuments: number;
    totalNotes: number;
    totalAudio: number;
    totalItems: number;
    totalConversations: number;
  };

  // First load tracking
  hasInitializedDocuments: boolean;
  hasInitializedConversations: boolean;
}

type DataAction = 
  | { type: 'DOCUMENTS_LOADING_START' }
  | { type: 'DOCUMENTS_LOADING_SUCCESS'; payload: Document[] }
  | { type: 'DOCUMENTS_LOADING_FAILURE'; payload: string }
  | { type: 'CONVERSATIONS_LOADING_START' }
  | { type: 'CONVERSATIONS_LOADING_SUCCESS'; payload: Conversation[] }
  | { type: 'CONVERSATIONS_LOADING_FAILURE'; payload: string }
  | { type: 'ADD_DOCUMENT'; payload: Document }
  | { type: 'UPDATE_DOCUMENT'; payload: Document }
  | { type: 'DELETE_DOCUMENT'; payload: string }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'UPDATE_CONVERSATION'; payload: Conversation }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  | { type: 'FORCE_REFRESH_DOCUMENTS' }
  | { type: 'FORCE_REFRESH_CONVERSATIONS' };

interface DataContextType extends DataState {
  // Document methods
  loadDocuments: (force?: boolean) => Promise<void>;
  addDocument: (document: Document) => void;
  updateDocument: (document: Document) => void;
  deleteDocument: (documentId: string) => void;
  
  // Conversation methods
  loadConversations: (force?: boolean) => Promise<void>;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversation: Conversation) => void;
  deleteConversation: (conversationId: string) => void;
  
  // Utility methods
  refreshAll: () => Promise<void>;
  isStale: (type: 'documents' | 'conversations') => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Cache duration in milliseconds (3 minutes for faster updates)
const CACHE_DURATION = 3 * 60 * 1000;

// Calculate stats from documents array
const calculateStats = (documents: Document[], conversationCount: number) => {
  const totalDocuments = documents.filter(d => d.document_type === 'pdf').length;
  const totalNotes = documents.filter(d => d.document_type === 'note').length;
  const totalAudio = documents.filter(d => d.document_type === 'audio').length;
  
  return {
    totalDocuments,
    totalNotes,
    totalAudio,
    totalItems: documents.length,
    totalConversations: conversationCount
  };
};

const dataReducer = (state: DataState, action: DataAction): DataState => {
  switch (action.type) {
    case 'DOCUMENTS_LOADING_START':
      return { 
        ...state, 
        documentsLoading: true, 
        documentsError: null 
      };
    
    case 'DOCUMENTS_LOADING_SUCCESS':
      return {
        ...state,
        documents: action.payload,
        documentsLoading: false,
        documentsError: null,
        documentsLastFetch: Date.now(),
        hasInitializedDocuments: true,
        stats: calculateStats(action.payload, state.stats.totalConversations)
      };
    
    case 'DOCUMENTS_LOADING_FAILURE':
      return {
        ...state,
        documentsLoading: false,
        documentsError: action.payload,
        hasInitializedDocuments: true
      };
    
    case 'CONVERSATIONS_LOADING_START':
      return { 
        ...state, 
        conversationsLoading: true, 
        conversationsError: null 
      };
    
    case 'CONVERSATIONS_LOADING_SUCCESS':
      return {
        ...state,
        conversations: action.payload,
        conversationsLoading: false,
        conversationsError: null,
        conversationsLastFetch: Date.now(),
        hasInitializedConversations: true,
        stats: calculateStats(state.documents, action.payload.length)
      };
    
    case 'CONVERSATIONS_LOADING_FAILURE':
      return {
        ...state,
        conversationsLoading: false,
        conversationsError: action.payload,
        hasInitializedConversations: true
      };
    
    case 'ADD_DOCUMENT':
      const newDocuments = [...state.documents, action.payload];
      return {
        ...state,
        documents: newDocuments,
        stats: calculateStats(newDocuments, state.stats.totalConversations)
      };
    
    case 'UPDATE_DOCUMENT':
      const updatedDocuments = state.documents.map(doc => 
        doc.id === action.payload.id ? action.payload : doc
      );
      return {
        ...state,
        documents: updatedDocuments,
        stats: calculateStats(updatedDocuments, state.stats.totalConversations)
      };
    
    case 'DELETE_DOCUMENT':
      const filteredDocuments = state.documents.filter(doc => doc.id !== action.payload);
      return {
        ...state,
        documents: filteredDocuments,
        stats: calculateStats(filteredDocuments, state.stats.totalConversations)
      };
    
    case 'ADD_CONVERSATION':
      const newConversations = [action.payload, ...state.conversations];
      return {
        ...state,
        conversations: newConversations,
        stats: calculateStats(state.documents, newConversations.length)
      };
    
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv => 
          conv.id === action.payload.id ? action.payload : conv
        )
      };
    
    case 'DELETE_CONVERSATION':
      const filteredConversations = state.conversations.filter(conv => conv.id !== action.payload);
      return {
        ...state,
        conversations: filteredConversations,
        stats: calculateStats(state.documents, filteredConversations.length)
      };
    
    case 'FORCE_REFRESH_DOCUMENTS':
      return {
        ...state,
        documentsLastFetch: null
      };
    
    case 'FORCE_REFRESH_CONVERSATIONS':
      return {
        ...state,
        conversationsLastFetch: null
      };
    
    default:
      return state;
  }
};

const initialState: DataState = {
  documents: [],
  conversations: [],
  documentsLoading: false,
  conversationsLoading: false,
  documentsLastFetch: null,
  conversationsLastFetch: null,
  documentsError: null,
  conversationsError: null,
  hasInitializedDocuments: false,
  hasInitializedConversations: false,
  stats: {
    totalDocuments: 0,
    totalNotes: 0,
    totalAudio: 0,
    totalItems: 0,
    totalConversations: 0
  }
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Check if data is stale (older than cache duration)
  const isStale = (type: 'documents' | 'conversations'): boolean => {
    const lastFetch = type === 'documents' ? state.documentsLastFetch : state.conversationsLastFetch;
    if (!lastFetch) return true;
    return Date.now() - lastFetch > CACHE_DURATION;
  };

  // Load documents with intelligent caching
  const loadDocuments = async (force = false) => {
    // Don't load if already loading
    if (state.documentsLoading) return;
    
    // Don't load if data is fresh and not forced (SMART CACHING)
    if (!force && !isStale('documents') && state.documents.length > 0) {
      console.log('📦 Using cached documents data');
      return;
    }

    // Only show loading on first load or if no data exists
    if (!state.hasInitializedDocuments || state.documents.length === 0) {
      console.log('🔄 Loading documents (first time or no data)');
    } else {
      console.log('🔄 Background refresh of documents');
    }

    dispatch({ type: 'DOCUMENTS_LOADING_START' });
    
    try {
      const result = await documentService.getAllItemsByType();
      
      if (result.success && result.data) {
        const allItems = [
          ...result.data.documents,
          ...result.data.notes,
          ...result.data.audio
        ];
        dispatch({ type: 'DOCUMENTS_LOADING_SUCCESS', payload: allItems });
        console.log('✅ Documents loaded successfully:', allItems.length, 'items');
      } else {
        throw new Error(result.error || 'Failed to load documents');
      }
    } catch (error: any) {
      console.error('❌ Documents loading failed:', error.message);
      dispatch({ type: 'DOCUMENTS_LOADING_FAILURE', payload: error.message });
    }
  };

  // Load conversations with intelligent caching
  const loadConversations = async (force = false) => {
    // Don't load if already loading
    if (state.conversationsLoading) return;
    
    // Don't load if data is fresh and not forced (SMART CACHING)
    if (!force && !isStale('conversations') && state.conversations.length > 0) {
      console.log('📦 Using cached conversations data');
      return;
    }

    // Only show loading on first load or if no data exists
    if (!state.hasInitializedConversations || state.conversations.length === 0) {
      console.log('🔄 Loading conversations (first time or no data)');
    } else {
      console.log('🔄 Background refresh of conversations');
    }

    dispatch({ type: 'CONVERSATIONS_LOADING_START' });
    
    try {
      const result = await conversationService.getConversations();
      
      if (result.success && result.data) {
        dispatch({ type: 'CONVERSATIONS_LOADING_SUCCESS', payload: result.data.conversations });
        console.log('✅ Conversations loaded successfully:', result.data.conversations.length, 'items');
      } else {
        throw new Error(result.error || 'Failed to load conversations');
      }
    } catch (error: any) {
      console.error('❌ Conversations loading failed:', error.message);
      dispatch({ type: 'CONVERSATIONS_LOADING_FAILURE', payload: error.message });
    }
  };

  // Document management methods
  const addDocument = (document: Document) => {
    dispatch({ type: 'ADD_DOCUMENT', payload: document });
  };

  const updateDocument = (document: Document) => {
    dispatch({ type: 'UPDATE_DOCUMENT', payload: document });
  };

  const deleteDocument = (documentId: string) => {
    dispatch({ type: 'DELETE_DOCUMENT', payload: documentId });
  };

  // Conversation management methods
  const addConversation = (conversation: Conversation) => {
    dispatch({ type: 'ADD_CONVERSATION', payload: conversation });
  };

  const updateConversation = (conversation: Conversation) => {
    dispatch({ type: 'UPDATE_CONVERSATION', payload: conversation });
  };

  const deleteConversation = (conversationId: string) => {
    dispatch({ type: 'DELETE_CONVERSATION', payload: conversationId });
  };

  // Refresh all data
  const refreshAll = async () => {
    console.log('🔄 Force refreshing all data');
    await Promise.all([
      loadDocuments(true),
      loadConversations(true)
    ]);
  };

  // Load initial data on mount with delay to avoid blocking UI
  useEffect(() => {
    console.log('🚀 DataContext initializing...');
    
    // Use setTimeout to prevent blocking the initial render
    const initializeData = async () => {
      // Load documents first (priority for dashboard)
      await loadDocuments();
      
      // Small delay before loading conversations to spread the load
      setTimeout(() => {
        loadConversations();
      }, 100);
    };

    // Slight delay to let the UI render first
    setTimeout(initializeData, 50);
  }, []);

  // Auto-refresh stale data when user becomes active (optional)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to tab, check for stale data
        if (isStale('documents')) {
          console.log('👁️ User returned: refreshing stale documents');
          loadDocuments();
        }
        if (isStale('conversations')) {
          console.log('👁️ User returned: refreshing stale conversations');
          loadConversations();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.documentsLastFetch, state.conversationsLastFetch]);

  const value: DataContextType = {
    ...state,
    loadDocuments,
    addDocument,
    updateDocument,
    deleteDocument,
    loadConversations,
    addConversation,
    updateConversation,
    deleteConversation,
    refreshAll,
    isStale
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};