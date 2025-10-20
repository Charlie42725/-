'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
}

export default function ImageUpload({
  label,
  value,
  onChange,
  required = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <label className="block text-slate-300 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {/* 預覽區域 */}
      {preview ? (
        <div className="mb-3">
          <div className="relative w-full h-48 bg-slate-700 rounded-lg overflow-hidden">
            <Image
              src={preview}
              alt="預覽"
              fill
              className="object-contain"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="mt-2 text-red-400 hover:text-red-300 text-sm"
          >
            移除圖片
          </button>
        </div>
      ) : (
        <div className="mb-3 border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-slate-500 transition-colors">
          <svg
            className="w-12 h-12 mx-auto text-slate-500 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-slate-400 text-sm">點擊下方按鈕選擇圖片</p>
          <p className="text-slate-500 text-xs mt-1">支援 JPG, PNG, GIF (最大 5MB)</p>
        </div>
      )}

      {/* 上傳按鈕 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id={`file-${label}`}
      />
      <label
        htmlFor={`file-${label}`}
        className={`
          inline-block px-4 py-2 bg-slate-700 text-white rounded-lg
          hover:bg-slate-600 transition-colors cursor-pointer
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {uploading ? '上傳中...' : preview ? '更換圖片' : '選擇圖片'}
      </label>

      {/* 或者輸入 URL */}
      <div className="mt-3">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setPreview(e.target.value);
          }}
          className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500"
          placeholder="或直接貼上圖片網址"
        />
      </div>
    </div>
  );
}
