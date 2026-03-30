'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn, formatDate } from '@/lib/utils';
import {
  Upload,
  File,
  FileText,
  Image as ImageIcon,
  Trash2,
  Download,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react';
import type { UploadRow } from '@/lib/database.types';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type UploadedFile = UploadRow;

type UploadInsertRecord = Pick<
  UploadRow,
  'user_id' | 'portfolio_item_id' | 'case_id' | 'file_name' | 'file_path' | 'file_size' | 'mime_type'
>;

interface FileUploadProps {
  portfolioItemId?: string;
  caseId?: string;
  existingFiles?: UploadedFile[];
  onFilesChange?: (files: UploadedFile[]) => void;
  compact?: boolean;
}

export function FileUpload({
  portfolioItemId,
  caseId,
  existingFiles = [],
  onFilesChange,
  compact = false,
}: FileUploadProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<UploadedFile[]>(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  // Helper to get current userId
  const getUserId = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  };

  const refreshFiles = useCallback(async () => {
    const userId = await getUserId();
    if (!userId) return;

    let query = supabase
      .from('uploads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (portfolioItemId) query = query.eq('portfolio_item_id', portfolioItemId);
    if (caseId) query = query.eq('case_id', caseId);

    const { data, error } = await query;
    if (error) {
      setError('Failed to load uploaded files. Please try again.');
      return;
    }

    const newFiles: UploadedFile[] = data ?? [];
    setFiles(newFiles);
    onFilesChange?.(newFiles);
  }, [portfolioItemId, caseId, supabase]);

  // Load existing files on mount
  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  const uploadFile = async (file: File) => {
    const userId = await getUserId();
    if (!userId) {
      setError('Not signed in. Please log in and try again.');
      return;
    }
    setError('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`File type not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setUploading(true);

    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const folder = portfolioItemId || caseId || 'general';
      const filePath = `${userId}/${folder}/${timestamp}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const uploadRecord: UploadInsertRecord = {
        user_id: userId,
        portfolio_item_id: portfolioItemId || null,
        case_id: caseId || null,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      };

      const { error: dbError } = await supabase
        .from('uploads')
        .insert(uploadRecord as never);

      if (dbError) throw dbError;

      await refreshFiles();
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    }

    setUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      Array.from(selectedFiles).forEach(uploadFile);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles) {
      Array.from(droppedFiles).forEach(uploadFile);
    }
  };

  const handleDelete = async (upload: UploadedFile) => {
    if (!confirm(`Delete ${upload.file_name}?`)) return;
    await supabase.storage.from('evidence').remove([upload.file_path]);
    await supabase.from('uploads').delete().eq('id', upload.id);
    await refreshFiles();
  };

  const handleDownload = async (upload: UploadedFile) => {
    const { data } = await supabase.storage
      .from('evidence')
      .createSignedUrl(upload.file_path, 3600);

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType === 'application/pdf') return FileText;
    return File;
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl cursor-pointer transition-all duration-150',
          compact ? 'p-4' : 'p-6',
          dragOver ? 'border-brand-400 bg-brand-50' : 'border-surface-200 hover:border-surface-300 hover:bg-surface-50/50'
        )}
      >
        <input ref={fileInputRef} type="file" multiple accept={ALLOWED_EXTENSIONS.join(',')} onChange={handleFileSelect} className="hidden" />
        <div className="flex flex-col items-center gap-2 text-center">
          {uploading ? <Loader2 className="w-6 h-6 text-brand-500 animate-spin" /> : <Upload className="w-6 h-6 text-surface-400" />}
          <div>
            <p className="text-sm font-medium text-surface-700">{uploading ? 'Uploading...' : 'Drop files here or click to browse'}</p>
            {!compact && <p className="text-xs text-surface-400 mt-1">PDF, PNG, JPG, DOC, DOCX — max 10MB per file</p>}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => {
            const Icon = getFileIcon(f.mime_type);
            return (
              <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-50 border border-surface-100 group">
                <div className="w-8 h-8 rounded-lg bg-white border border-surface-200 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-surface-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-700 truncate">{f.file_name}</p>
                  <p className="text-xs text-surface-400">{formatFileSize(f.file_size)} · {formatDate(f.created_at)}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handleDownload(f); }} className="p-1.5 rounded-md hover:bg-surface-200 text-surface-500" title="Download">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(f); }} className="p-1.5 rounded-md hover:bg-red-100 text-surface-500 hover:text-red-600" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
