'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * 첫 클라이언트 렌더가 서버 렌더와 같아지도록 막아주는 플래그.
 *
 * localStorage 를 읽는 상태(zustand persist, next-themes)는 클라이언트의
 * 첫 렌더부터 저장값을 들고 있지만 서버는 기본값으로 그렸다. 그대로 쓰면
 * aria-pressed 같은 속성이 어긋나 하이드레이션 경고가 난다.
 * 마운트 이후에만 저장값을 반영한다.
 *
 * useEffect + setState 대신 useSyncExternalStore 를 쓰는 이유: 서버 스냅샷과
 * 클라이언트 스냅샷을 따로 주는 게 이 훅이 하려는 일 그 자체고,
 * 이펙트 안에서 setState 를 불러 연쇄 렌더를 만들지 않는다.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
