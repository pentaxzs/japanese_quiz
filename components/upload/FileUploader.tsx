'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api-client';

interface FileUploaderProps {
  onExtracted: (result: {
    words: Array<{ japanese: string; reading: string; korean: string }>;
    sentences: Array<{ japanese: string; reading: string; korean: string }>;
  }) => void;
}

const MAX_PDF_PAGES = 5;

export function FileUploader({ onExtracted }: FileUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('AI가 분석 중입니다...');
  const [error, setError] = useState<string | null>(null);

  async function extractFromBase64(base64Data: string, mimeType: string) {
    const res = await apiFetch('/api/extract', {
      method: 'POST',
      body: { image: base64Data, mimeType },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? '추출 중 오류가 발생했습니다.');
    }
    const { data } = await res.json();
    return data as {
      words: Array<{ japanese: string; reading: string; korean: string }>;
      sentences: Array<{ japanese: string; reading: string; korean: string }>;
    };
  }

  async function processPdf(file: File) {
    // Dynamic import for code splitting
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = Math.min(pdf.numPages, MAX_PDF_PAGES);

    const allWords: typeof words = [];
    const allSentences: typeof sentences = [];
    let words: Array<{ japanese: string; reading: string; korean: string }> = [];
    let sentences: Array<{ japanese: string; reading: string; korean: string }> = [];

    for (let i = 1; i <= totalPages; i++) {
      setLoadingMessage(`페이지 ${i}/${totalPages} 분석 중...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;

      await page.render({ canvasContext: ctx, viewport, canvas }).promise;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64Data = dataUrl.split(',')[1];

      const result = await extractFromBase64(base64Data, 'image/jpeg');
      allWords.push(...result.words);
      allSentences.push(...result.sentences);
    }

    // Deduplicate by japanese field
    const uniqueWords = Array.from(new Map(allWords.map((w) => [w.japanese, w])).values());
    const uniqueSentences = Array.from(new Map(allSentences.map((s) => [s.japanese, s])).values());

    return { words: uniqueWords, sentences: uniqueSentences };
  }

  const processFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      setLoadingMessage('AI가 분석 중입니다...');

      try {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('파일 크기는 10MB 이하여야 합니다.');
        }

        let result;
        if (file.type === 'application/pdf') {
          result = await processPdf(file);
        } else {
          const base64 = await fileToBase64(file) as string;
          const mimeType = file.type || 'image/jpeg';
          const base64Data = base64.split(',')[1];
          result = await extractFromBase64(base64Data, mimeType);
        }

        onExtracted(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    },
    [onExtracted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && processFile(files[0]),
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
    },
    multiple: false,
    disabled: isLoading,
  });

  return (
    <div className="space-y-4">
      {/* Drag & Drop area */}
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors',
          isDragActive
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
            : 'border-muted-foreground/30 hover:border-indigo-400 hover:bg-accent',
          isLoading && 'pointer-events-none opacity-60'
        )}
      >
        <input {...getInputProps()} />
        {isLoading ? (
          <>
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm font-medium">{loadingMessage}</p>
          </>
        ) : (
          <>
            <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">
              {isDragActive ? '여기에 놓으세요' : '이미지 또는 PDF를 드래그하거나 클릭해서 업로드'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPG, PNG, WEBP, PDF (최대 10MB · PDF는 최대 5페이지)
            </p>
          </>
        )}
      </div>

      {/* Camera button for mobile */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">또는</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="flex gap-2">
        <label className="flex-1">
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={isLoading}
            asChild
          >
            <span>
              <Camera className="h-4 w-4" />
              카메라로 촬영
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                disabled={isLoading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                  e.target.value = '';
                }}
              />
            </span>
          </Button>
        </label>

        <label className="flex-1">
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={isLoading}
            asChild
          >
            <span>
              <FileText className="h-4 w-4" />
              PDF 선택
              <input
                type="file"
                accept="application/pdf"
                className="sr-only"
                disabled={isLoading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                  e.target.value = '';
                }}
              />
            </span>
          </Button>
        </label>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
