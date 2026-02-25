'use client';

import { useState, useRef, useEffect } from 'react';

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  id?: string;
}

export default function ImageUpload({
  label,
  value,
  onChange,
  required = false,
  id,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = id || `file-${label}`;

  // 同步外部 value 到 preview
  useEffect(() => {
    setPreview(value);
  }, [value]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // 檢查文件大小 (最大 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(`檔案過大（${(file.size / 1024 / 1024).toFixed(1)}MB），上限 10MB`);
      return;
    }

    // 先用本地預覽（instant feedback）
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error(`伺服器回傳格式錯誤 (HTTP ${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error || `上傳失敗 (HTTP ${res.status})`);
      }

      // 上傳成功 → 切換到伺服器 URL
      URL.revokeObjectURL(localUrl);
      setPreview(data.url);
      onChange(data.url);
    } catch (err: unknown) {
      console.error('上傳圖片失敗:', err);
      // 失敗 → 清除本地預覽
      URL.revokeObjectURL(localUrl);
      setPreview('');
      const msg = err instanceof Error ? err.message : '上傳圖片失敗';
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setPreview('');
    setError('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div>
      <label className="block text-zinc-300 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
        id={inputId}
      />

      {/* 錯誤提示 */}
      {error && (
        <div className="mb-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* 預覽區域 / 點擊上傳區域 */}
      {preview ? (
        <div className="mb-3">
          <div className="relative w-full h-48 bg-zinc-700 rounded-lg overflow-hidden group">
            {/* 用原生 img 避免 Next.js Image 優化問題 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="預覽"
              className="w-full h-full object-contain"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            {/* hover 時顯示更換與刪除 */}
            {!uploading && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <label
                  htmlFor={inputId}
                  className="px-3 py-1.5 bg-zinc-700 text-white text-sm rounded-lg hover:bg-zinc-600 transition-colors cursor-pointer"
                >
                  更換圖片
                </label>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-500 transition-colors"
                >
                  移除
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={`
            mb-3 block border-2 border-dashed border-zinc-600 rounded-lg h-48
            flex flex-col items-center justify-center
            hover:border-amber-500/60 hover:bg-zinc-800/50 transition-colors cursor-pointer
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-zinc-500/30 border-t-zinc-300 rounded-full animate-spin" />
              <span className="text-zinc-400 text-sm">上傳中...</span>
            </div>
          ) : (
            <>
              <svg className="w-10 h-10 text-zinc-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <p className="text-zinc-400 text-sm">點擊上傳圖片</p>
              <p className="text-zinc-500 text-xs mt-1">JPG, PNG, GIF, WebP (最大 10MB)</p>
            </>
          )}
        </label>
      )}

      {/* 或者輸入 URL */}
      <div className="mt-3">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setError('');
            onChange(e.target.value);
            setPreview(e.target.value);
          }}
          className="w-full bg-zinc-700 text-white border border-zinc-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500"
          placeholder="或直接貼上圖片網址"
        />
      </div>
    </div>
  );
}
