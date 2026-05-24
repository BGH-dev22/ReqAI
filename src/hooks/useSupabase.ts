import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export function useSupabase() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Test connection
    supabase.auth.getUser()
      .then(() => setIsConnected(true))
      .catch((err) => {
        setError(err.message);
        setIsConnected(false);
      });
  }, []);

  const uploadFile = async (bucketName: string, path: string, file: File) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;
      return data;
    } catch (err) {
      throw new Error(`Upload error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const downloadFile = async (bucketName: string, path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(path);

      if (error) throw error;
      return data;
    } catch (err) {
      throw new Error(`Download error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const deleteFile = async (bucketName: string, path: string) => {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([path]);

      if (error) throw error;
    } catch (err) {
      throw new Error(`Delete error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  return {
    supabase,
    isConnected,
    error,
    uploadFile,
    downloadFile,
    deleteFile,
  };
}
