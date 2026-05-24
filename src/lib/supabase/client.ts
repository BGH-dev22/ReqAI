import { createClient } from '@supabase/supabase-js';

// URL et clé Supabase locale
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getDocuments(userId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getDocument(documentId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error) throw error;
  return data;
}

export async function createDocument(
  userId: string,
  fileName: string,
  format: string,
  size: number,
  storageUrl: string
) {
  const { data, error } = await supabase
    .from('documents')
    .insert([
      {
        user_id: userId,
        file_name: fileName,
        format,
        size,
        storage_url: storageUrl,
        status: 'uploaded',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDocumentStatus(
  documentId: string,
  status: string
) {
  const { data, error } = await supabase
    .from('documents')
    .update({ status, processed_at: new Date() })
    .eq('id', documentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDocument(documentId: string) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) throw error;
}

export async function getRequirements(documentId: string) {
  const { data, error } = await supabase
    .from('requirements')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createRequirement(
  documentId: string,
  title: string,
  description: string,
  type: string,
  priority: string,
  pageNumber: number,
  section: string,
  sourceText: string
) {
  const { data, error } = await supabase
    .from('requirements')
    .insert([
      {
        document_id: documentId,
        title,
        description,
        type,
        priority,
        page_number: pageNumber,
        section,
        source_text: sourceText,
        status: 'draft',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRequirement(
  requirementId: string,
  updates: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('requirements')
    .update(updates)
    .eq('id', requirementId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRequirement(requirementId: string) {
  const { error } = await supabase
    .from('requirements')
    .delete()
    .eq('id', requirementId);

  if (error) throw error;
}
