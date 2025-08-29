
-- Create organizations table for multi-tenant support
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  org_id UUID REFERENCES public.organizations NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table for file storage and processing
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  file_path TEXT,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  source_url TEXT,
  metadata JSONB DEFAULT '{}',
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  embeddings_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document chunks table for RAG
CREATE TABLE public.document_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents ON DELETE CASCADE NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536), -- OpenAI ada-002 embedding size
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table for chat history
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for chat messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create integrations table for external connections
CREATE TABLE public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('gmail', 'slack', 'notion', 'zoom', 'teams')),
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics_events table for usage tracking
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations NOT NULL,
  user_id UUID REFERENCES auth.users,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create processing_jobs table for background tasks
CREATE TABLE public.processing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('embedding', 'transcription', 'document_parsing', 'email_sync')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  input_data JSONB NOT NULL DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organization" ON public.organizations
  FOR SELECT USING (id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their organization" ON public.profiles
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for documents
CREATE POLICY "Users can view documents in their organization" ON public.documents
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create documents in their organization" ON public.documents
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for document chunks
CREATE POLICY "Users can view chunks from their organization's documents" ON public.document_chunks
  FOR SELECT USING (document_id IN (SELECT id FROM public.documents WHERE org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid())));

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations in their organization" ON public.conversations
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create conversations in their organization" ON public.conversations
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()) AND user_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Users can view messages from their organization's conversations" ON public.messages
  FOR SELECT USING (conversation_id IN (SELECT id FROM public.conversations WHERE org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can create messages in their organization's conversations" ON public.messages
  FOR INSERT WITH CHECK (conversation_id IN (SELECT id FROM public.conversations WHERE org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid())));

-- RLS Policies for integrations
CREATE POLICY "Users can view integrations in their organization" ON public.integrations
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage integrations in their organization" ON public.integrations
  FOR ALL USING (org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()) AND user_id = auth.uid());

-- RLS Policies for analytics events
CREATE POLICY "Users can view analytics for their organization" ON public.analytics_events
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for processing jobs
CREATE POLICY "Users can view jobs in their organization" ON public.processing_jobs
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_org_id ON public.profiles(org_id);
CREATE INDEX idx_documents_org_id ON public.documents(org_id);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_processing_status ON public.documents(processing_status);
CREATE INDEX idx_document_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX idx_conversations_org_id ON public.conversations(org_id);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_integrations_org_id ON public.integrations(org_id);
CREATE INDEX idx_analytics_events_org_id ON public.analytics_events(org_id);
CREATE INDEX idx_processing_jobs_status ON public.processing_jobs(status);

-- Enable the vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create vector similarity search index
CREATE INDEX idx_document_chunks_embedding ON public.document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Insert a default organization for testing
INSERT INTO public.organizations (name, slug) VALUES ('Default Organization', 'default-org');
