'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onUpload: (url: string, fileName: string) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  disabled?: boolean;
}

export function FileUploader({
  onUpload,
  accept,
  maxSizeMB = 50,
  className,
  disabled = false,
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`);
      return;
    }

    setUploading(true);
    try {
      // TODO: Supabase Storage 직접 업로드 구현 (Task 9에서 완성)
      // For now, placeholder
      const placeholderUrl = `https://storage.placeholder.com/${encodeURIComponent(file.name)}`;
      onUpload(placeholderUrl, file.name);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      void handleFile(file);
    }
  };

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
        dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled || uploading}
        className="hidden"
      />
      <p className="text-sm text-muted-foreground mb-2">
        {uploading ? '업로드 중...' : '파일을 드래그하거나 클릭하여 업로드'}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? '업로드 중...' : '파일 선택'}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">최대 {maxSizeMB}MB</p>
    </div>
  );
}
