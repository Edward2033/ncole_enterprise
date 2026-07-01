/**
 * ImageUploader — reusable CMS-style image upload component.
 * Uses the existing POST /products/upload-image Cloudinary endpoint.
 * Choose Image → Upload → Preview → (optional) Replace
 */
import React, { useRef, useState } from 'react';
import { UploadCloud, X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { API_BASE } from '@/config/api';
import { getTokens } from '@/services/api';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPT    = 'image/jpeg,image/png,image/webp';

interface Props {
  /** Current URL (pre-populated when editing) */
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

const ImageUploader: React.FC<Props> = ({ value, onChange, disabled }) => {
  const inputRef                    = useRef<HTMLInputElement>(null);
  const [uploading, setUploading]   = useState(false);
  const [progress,  setProgress]    = useState(0);
  const [error,     setError]       = useState('');
  const [success,   setSuccess]     = useState(false);

  const reset = () => {
    onChange('');
    setError('');
    setSuccess(false);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = async (file: File) => {
    setError(''); setSuccess(false);

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('File is too large. Maximum size is 5 MB.');
      return;
    }

    const fd = new FormData();
    fd.append('image', file);

    setUploading(true);
    setProgress(0);

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/products/upload-image`);

        const { accessToken } = getTokens();
        if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

        xhr.upload.onprogress = e => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const json = JSON.parse(xhr.responseText);
              onChange(json.data.url);
              setSuccess(true);
              setProgress(100);
              resolve();
            } catch {
              reject(new Error('Invalid response from server.'));
            }
          } else {
            try {
              const json = JSON.parse(xhr.responseText);
              reject(new Error(json.error || `Upload failed (${xhr.status})`));
            } catch {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload.'));
        xhr.send(fd);
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (value && !uploading) {
    return (
      <div className="space-y-2">
        <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <img
            src={value}
            alt="Uploaded preview"
            className="w-full h-40 object-cover"
            onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition flex items-center justify-center opacity-0 hover:opacity-100 gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-white transition"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Replace
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        </div>
        {success && (
          <p className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <CheckCircle className="h-3.5 w-3.5" /> Uploaded successfully
          </p>
        )}
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onInputChange} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => !uploading && !disabled && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition cursor-pointer
          ${uploading || disabled
            ? 'border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
            : 'border-slate-300 dark:border-slate-600 hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-900/10'
          }`}
      >
        {uploading ? (
          <>
            <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-orange-500 animate-spin" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Uploading… {progress}%</p>
            <div className="w-full max-w-[200px] h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <UploadCloud className="h-6 w-6 text-orange-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Click to upload <span className="text-orange-500">or drag & drop</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WEBP · Max 5 MB</p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={onInputChange}
        disabled={uploading || disabled}
      />
    </div>
  );
};

export default ImageUploader;
