import { useEffect, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

/**
 * パフォーマンス監視フック
 * コンポーネントのレンダリング時間やライフサイクルを監視
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>();
  const mountTime = useRef<number>();

  // マウント時の記録
  useEffect(() => {
    const now = performance.now();
    mountTime.current = now;
    
    logger.performance('Component mounted', now - (renderStartTime.current || now), {
      component: componentName,
      mountTime: now
    });

    // アンマウント時の記録
    return () => {
      const unmountTime = performance.now();
      const lifeTime = unmountTime - (mountTime.current || unmountTime);
      
      logger.performance('Component unmounted', lifeTime, {
        component: componentName,
        lifeTime,
        unmountTime
      });
    };
  }, [componentName]);

  // レンダリング開始を記録
  renderStartTime.current = performance.now();

  // レンダリング完了を記録
  useEffect(() => {
    const renderEndTime = performance.now();
    const renderDuration = renderEndTime - (renderStartTime.current || renderEndTime);
    
    if (renderDuration > 16) { // 16ms = 60fps threshold
      logger.warn('Slow render detected', {
        component: componentName,
        renderDuration,
        threshold: 16
      }, 'performance');
    } else {
      logger.performance('Component rendered', renderDuration, {
        component: componentName
      });
    }
  });

  // 重い処理の実行時間を測定する関数
  const measureOperation = useCallback((operationName: string, operation: () => void | Promise<void>) => {
    const startTime = performance.now();
    
    const result = operation();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        logger.performance(`Async operation: ${operationName}`, duration, {
          component: componentName,
          operation: operationName,
          type: 'async'
        });
      });
    } else {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logger.performance(`Operation: ${operationName}`, duration, {
        component: componentName,
        operation: operationName,
        type: 'sync'
      });
      
      return result;
    }
  }, [componentName]);

  return { measureOperation };
};

/**
 * エラーバウンダリー用ログフック
 */
export const useErrorLogger = (componentName: string) => {
  const logError = useCallback((error: Error, errorInfo?: any) => {
    logger.error(`Error in ${componentName}`, {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      errorBoundary: componentName
    }, 'error');
  }, [componentName]);

  return { logError };
};

/**
 * ユーザーアクション監視フック
 */
export const useUserActionLogger = (componentName: string) => {
  const logAction = useCallback((action: string, context?: any) => {
    logger.userAction(`${componentName}: ${action}`, {
      component: componentName,
      ...context
    });
  }, [componentName]);

  const logClick = useCallback((elementId: string, context?: any) => {
    logAction('click', { elementId, ...context });
  }, [logAction]);

  const logInput = useCallback((fieldName: string, value?: any) => {
    logAction('input', { fieldName, valueType: typeof value });
  }, [logAction]);

  const logSubmit = useCallback((formName: string, data?: any) => {
    logAction('submit', { 
      formName, 
      fieldCount: data ? Object.keys(data).length : 0 
    });
  }, [logAction]);

  return {
    logAction,
    logClick,
    logInput,
    logSubmit
  };
};

/**
 * API呼び出し監視フック
 */
export const useApiLogger = () => {
  const logApiCall = useCallback(async <T>(
    apiName: string,
    apiCall: () => Promise<T>,
    context?: any
  ): Promise<T> => {
    const startTime = performance.now();
    
    logger.info(`API call started: ${apiName}`, {
      api: apiName,
      ...context
    }, 'api');

    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      logger.performance(`API call completed: ${apiName}`, duration, {
        api: apiName,
        success: true,
        ...context
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      logger.error(`API call failed: ${apiName}`, {
        api: apiName,
        error: error instanceof Error ? error.message : String(error),
        duration,
        ...context
      }, 'api');
      
      throw error;
    }
  }, []);

  return { logApiCall };
};

/**
 * メモリ使用量監視フック
 */
export const useMemoryMonitor = (intervalMs: number = 30000) => {
  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        
        logger.performance('Memory usage', 0, {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        });

        // メモリ使用量が90%を超えた場合は警告
        if ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) > 0.9) {
          logger.warn('High memory usage detected', {
            usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
            usedJSHeapSize: memory.usedJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit
          }, 'performance');
        }
      }
    };

    // 初回実行
    checkMemory();

    // 定期実行
    const interval = setInterval(checkMemory, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);
};

export default {
  usePerformanceMonitor,
  useErrorLogger,
  useUserActionLogger,
  useApiLogger,
  useMemoryMonitor
};
