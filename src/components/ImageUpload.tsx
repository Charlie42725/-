'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = id || `file-${label}`;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // 檢查文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('文件大小不能超過 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '上傳失敗');
      }

      const data = await res.json();
      setPreview(data.url);
      onChange(data.url);
    } catch (error: unknown) {
      console.error('上傳圖片失敗:', error);
      const errorMessage = error instanceof Error ? error.message : '上傳圖片失敗';
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setPreview('');
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

      {/* 預覽區域 / 點擊上傳區域 */}
      {preview ? (
        <div className="mb-3">
          <div className="relative w-full h-48 bg-zinc-700 rounded-lg overflow-hidden group">
            <Image
              src={preview}
              alt="預覽"
              fill
              className="object-contain"
            />
            {/* hover 時顯示更換與刪除 */}
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
            <div className="text-zinc-400 text-sm">上傳中...</div>
          ) : (
            <>
              <svg className="w-10 h-10 text-zinc-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <p className="text-zinc-400 text-sm">點擊上傳圖片</p>
              <p className="text-zinc-500 text-xs mt-1">JPG, PNG, GIF (最大 5MB)</p>
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
