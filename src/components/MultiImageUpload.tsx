'use client';

import { useState } from 'react';

interface MultiImageUploadProps {
  label: string;
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export default function MultiImageUpload({
  label,
  images,
  onChange,
  maxImages = 0,
}: MultiImageUploadProps) {
  const hasLimit = maxImages > 0;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    setError('');

    // 檢查是否超過最大數量
    if (hasLimit && images.length + files.length > maxImages) {
      setError(`最多只能上傳 ${maxImages} 張圖片`);
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        // 檢查文件大小
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} 檔案過大（${(file.size / 1024 / 1024).toFixed(1)}MB），上限 10MB`);
        }

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

        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onChange([...images, ...uploadedUrls]);
    } catch (err: unknown) {
      console.error('上傳圖片失敗:', err);
      const msg = err instanceof Error ? err.message : '上傳圖片失敗';
      setError(msg);
    } finally {
      setUploading(false);
      // 清空 input
      e.target.value = '';
    }
  }

  function handleRemove(index: number) {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  }

  function handleUrlAdd() {
    const url = prompt('請輸入圖片網址：');
    if (url && url.trim()) {
      if (hasLimit && images.length >= maxImages) {
        setError(`最多只能上傳 ${maxImages} 張圖片`);
        return;
      }
      onChange([...images, url.trim()]);
    }
  }

  return (
    <div>
      <label className="block text-zinc-300 mb-2">
        {label} ({images.length}{hasLimit ? `/${maxImages}` : ' 張'})
      </label>

      {/* 錯誤提示 */}
      {error && (
        <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* 圖片預覽網格 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {images.map((url, index) => (
          <div key={index} className="relative group">
            <div className="relative h-32 bg-zinc-700 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`圖片 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="absolute bottom-1 left-1 bg-zinc-900/80 text-white text-xs px-2 py-1 rounded">
              #{index + 1}
            </div>
          </div>
        ))}

        {/* 上傳按鈕 */}
        {(!hasLimit || images.length < maxImages) && (
          <label
            className={`
              h-32 border-2 border-dashed border-zinc-600 rounded-lg
              flex flex-col items-center justify-center
              hover:border-zinc-500 transition-colors cursor-pointer
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-zinc-500/30 border-t-zinc-300 rounded-full animate-spin" />
                <span className="text-zinc-400 text-sm">上傳中...</span>
              </div>
            ) : (
              <>
                <svg className="w-8 h-8 text-zinc-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-zinc-400 text-sm">選擇圖片</span>
              </>
            )}
          </label>
        )}
      </div>

      {/* 操作按鈕 */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={handleUrlAdd}
          disabled={hasLimit && images.length >= maxImages}
          className="text-sm text-blue-400 hover:text-blue-300 disabled:text-zinc-600 disabled:cursor-not-allowed"
        >
          + 添加圖片網址
        </button>
      </div>

      <p className="text-xs text-zinc-500 mt-2">
        支援 JPG, PNG, GIF, WebP (最大 10MB)
      </p>
    </div>
  );
}
