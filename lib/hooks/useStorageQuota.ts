'use client';

import { useState, useEffect } from 'react';

interface StorageQuota {
  usage: number;
  total: number;
  percent: number;
}

export function useStorageQuota(): StorageQuota | null {
  const [quota, setQuota] = useState<StorageQuota | null>(null);

  useEffect(() => {
    if (!navigator.storage?.estimate) return;

    navigator.storage.estimate().then((est) => {
      const usage = est.usage ?? 0;
      const total = est.quota ?? 0;
      setQuota({ usage, total, percent: total > 0 ? (usage / total) * 100 : 0 });
    });
  }, []);

  return quota;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
