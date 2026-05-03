'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Download, Upload, Trash2, HardDrive, Shield, Key, Eye, EyeOff, CheckCircle2, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSettingsStore } from '@/store/settings-store';
import { storage, requestPersistentStorage } from '@/lib/storage';
import { useStorageQuota, formatBytes } from '@/lib/hooks/useStorageQuota';
import type { BackupData } from '@/lib/types';
import { toast } from 'sonner';

const BACKUP_VERSION = 1;

export default function SettingsPage() {
  const { showFurigana, quizDirection, toggleFurigana, setQuizDirection, apiKey, setApiKey } =
    useSettingsStore();
  const { theme, setTheme } = useTheme();
  const quota = useStorageQuota();
  const [isPersisted, setIsPersisted] = useState<boolean | null>(null);
  const [keyInput, setKeyInput] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (navigator.storage?.persisted) {
      navigator.storage.persisted().then(setIsPersisted);
    }
  }, []);

  async function handleExport() {
    try {
      const data = await storage.exportAll();
      const json = JSON.stringify({ ...data, version: BACKUP_VERSION }, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jp-quiz-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('백업이 다운로드되었습니다.');
    } catch {
      toast.error('백업 중 오류가 발생했습니다.');
    }
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;
      await storage.importAll(data);
      toast.success('데이터가 가져와졌습니다.');
    } catch {
      toast.error('파일 형식이 올바르지 않습니다.');
    }
  }

  async function handleClearAll() {
    if (!confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    await storage.clearAll();
    toast.success('모든 데이터가 삭제되었습니다.');
  }

  async function handlePersist() {
    const result = await requestPersistentStorage();
    setIsPersisted(result);
    if (result) toast.success('영속 저장소가 활성화되었습니다.');
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
      <h1 className="text-lg font-semibold">설정</h1>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Key className="h-4 w-4" />
            Anthropic API 키
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            이 서비스는 Anthropic Claude API를 사용합니다.{' '}
            <a
              href="https://console.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-indigo-600"
            >
              console.anthropic.com
            </a>
            에서 발급한 키를 입력하세요. 키는 이 기기에만 저장되며 서버로 전송되지 않습니다.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="pr-10 text-base font-mono"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              onClick={() => { setApiKey(keyInput.trim()); toast.success('API 키가 저장되었습니다.'); }}
              disabled={keyInput.trim() === apiKey}
            >
              저장
            </Button>
          </div>
          {apiKey && (
            <p className="flex items-center gap-1.5 text-xs text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              API 키가 설정되어 있습니다.
            </p>
          )}
          {!apiKey && (
            <p className="text-xs text-red-500">
              API 키를 입력해야 이미지 업로드 및 퀴즈 기능을 사용할 수 있습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Display settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">표시 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm">후리가나 표시</span>
            <button
              role="switch"
              aria-checked={showFurigana}
              onClick={toggleFurigana}
              className={`relative h-6 w-11 rounded-full transition-colors overflow-hidden ${showFurigana ? 'bg-indigo-600' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${showFurigana ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm">
              <Moon className="h-4 w-4" />
              다크 모드
            </span>
            <button
              role="switch"
              aria-checked={theme === 'dark'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`relative h-6 w-11 rounded-full transition-colors overflow-hidden ${theme === 'dark' ? 'bg-indigo-600' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </label>

          <div className="flex items-center justify-between">
            <span className="text-sm">퀴즈 방향</span>
            <select
              value={quizDirection}
              onChange={(e) => setQuizDirection(e.target.value as 'random' | 'jp-to-kr' | 'kr-to-jp')}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              <option value="random">랜덤</option>
              <option value="jp-to-kr">일어→한국어</option>
              <option value="kr-to-jp">한국어→일어</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Storage info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            저장소
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quota && (
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>사용 중: {formatBytes(quota.usage)}</span>
                <span>{quota.percent.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${Math.min(quota.percent, 100)}%` }}
                />
              </div>
            </div>
          )}

          {isPersisted !== null && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Shield className={`h-4 w-4 ${isPersisted ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span>{isPersisted ? '영속 저장소 활성화됨' : '영속 저장소 비활성화'}</span>
              </div>
              {!isPersisted && (
                <Button size="sm" variant="outline" onClick={handlePersist}>
                  활성화
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">데이터 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full gap-2 justify-start" onClick={handleExport}>
            <Download className="h-4 w-4" />
            백업 내보내기
          </Button>

          <label className="block">
            <Button variant="outline" className="w-full gap-2 justify-start" asChild>
              <span>
                <Upload className="h-4 w-4" />
                백업 가져오기
                <input
                  type="file"
                  accept=".json"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImport(file);
                    e.target.value = '';
                  }}
                />
              </span>
            </Button>
          </label>

          <Button
            variant="destructive"
            className="w-full gap-2 justify-start"
            onClick={handleClearAll}
          >
            <Trash2 className="h-4 w-4" />
            모든 데이터 삭제
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">일본어 퀴즈 v1.0.0</p>
    </div>
  );
}
