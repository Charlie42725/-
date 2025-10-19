'use client';

import { useState } from 'react';
import Image from 'next/image';

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
  maxImages = 4,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // 檢查是否超過最大數量
    if (images.length + files.length > maxImages) {
      alert(`最多只能上傳 ${maxImages} 張圖片`);
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        // 檢查文件大小
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} 文件大小超過 5MB`);
        }

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
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onChange([...images, ...uploadedUrls]);
    } catch (error: any) {
      console.error('上傳圖片失敗:', error);
      alert(error.message || '上傳圖片失敗');
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
      if (images.length >= maxImages) {
        alert(`最多只能上傳 ${maxImages} 張圖片`);
        return;
      }
      onChange([...images, url.trim()]);
    }
  }

  return (
    <div>
      <label className="block text-slate-300 mb-2">
        {label} ({images.length}/{maxImages})
      </label>

      {/* 圖片預覽網格 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {images.map((url, index) => (
          <div key={index} className="relative group">
            <div className="relative h-32 bg-slate-700 rounded-lg overflow-hidden">
              <Image
                src={url}
                alt={`圖片 ${index + 1}`}
                fill
                className="object-cover"
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
            <div className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-xs px-2 py-1 rounded">
              #{index + 1}
            </div>
          </div>
        ))}

        {/* 上傳按鈕 */}
        {images.length < maxImages && (
          <label
            className={`
              h-32 border-2 border-dashed border-slate-600 rounded-lg
              flex flex-col items-center justify-center
              hover:border-slate-500 transition-colors cursor-pointer
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
              <div className="text-slate-400 text-sm">上傳中...</div>
            ) : (
              <>
                <svg className="w-8 h-8 text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-slate-400 text-sm">選擇圖片</span>
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
          disabled={images.length >= maxImages}
          className="text-sm text-blue-400 hover:text-blue-300 disabled:text-slate-600 disabled:cursor-not-allowed"
        >
          + 添加圖片網址
        </button>
      </div>

      <p className="text-xs text-slate-500 mt-2">
        支援 JPG, PNG, GIF (最大 5MB)，拖動圖片可調整順序
      </p>
    </div>
  );
}
