import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentUploaderProps {
  onFileSelected: (file: File) => Promise<void>;
  isLoading?: boolean;
  acceptedFormats?: string[];
  maxSize?: number;
}

export function DocumentUploader({
  onFileSelected,
  isLoading = false,
  acceptedFormats = ['.pdf', '.docx'],
  maxSize = 10 * 1024 * 1024,
}: DocumentUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const handleDrag = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setIsDragActive(true);
      } else if (e.type === 'dragleave') {
        setIsDragActive(false);
      }
    },
    []
  );

  const handleValidateFile = (file: File): boolean => {
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!acceptedFormats.includes(fileExt)) {
      alert(`Format accepté: ${acceptedFormats.join(', ')}`);
      return false;
    }

    if (file.size > maxSize) {
      alert(`Taille maximale: ${(maxSize / 1024 / 1024).toFixed(0)} Mo`);
      return false;
    }

    return true;
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (handleValidateFile(file)) {
          setUploadedFile(file.name);
          await onFileSelected(file);
        }
      }
    },
    [onFileSelected]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (handleValidateFile(file)) {
          setUploadedFile(file.name);
          await onFileSelected(file);
        }
      }
    },
    [onFileSelected]
  );

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Upload className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Zone de Glisser-Déposer</h3>
            <p className="text-sm text-slate-400">Uploadez vos documents techniques</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer',
            isDragActive
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
          )}
        >
          <input
            type="file"
            onChange={handleFileInput}
            disabled={isLoading}
            accept={acceptedFormats.join(',')}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          <div className="space-y-4">
            <div className="flex justify-center">
              {isLoading ? (
                <div className="h-16 w-16 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                  <Loader className="h-8 w-8 text-blue-400 animate-spin" />
                </div>
              ) : uploadedFile ? (
                <div className="h-16 w-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
              )}
            </div>

            <div>
              <p className="font-semibold text-lg text-white">
                {isLoading 
                  ? 'Téléchargement en cours...' 
                  : uploadedFile 
                    ? uploadedFile 
                    : 'Glissez votre document ici'
                }
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {isLoading 
                  ? 'Veuillez patienter...' 
                  : uploadedFile 
                    ? 'Fichier prêt pour analyse' 
                    : 'ou cliquez pour sélectionner'
                }
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 text-xs">
              <span className="px-3 py-1.5 bg-slate-800 rounded-lg text-slate-400">
                Formats: {acceptedFormats.join(', ')}
              </span>
              <span className="px-3 py-1.5 bg-slate-800 rounded-lg text-slate-400">
                Max: {(maxSize / 1024 / 1024).toFixed(0)} Mo
              </span>
            </div>

            {isLoading && (
              <Button disabled className="mt-4 bg-slate-800 text-slate-400">
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Traitement en cours...
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
