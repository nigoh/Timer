import { useRef, useEffect } from 'react';
import { logger } from '@/utils/logger';

/**
 * 対象要素が他の要素と重なっていないかを ResizeObserver で監視するフック。
 * 要素への ref を返すので、監視したい DOM 要素に `ref={...}` で渡す。
 */
export function useLayoutOverlapDetection(label: string) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) {
          logger.warn(`${label}: 要素のサイズがゼロになりました`, { width, height }, 'useLayoutOverlapDetection');
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [label]);

  return ref;
}
