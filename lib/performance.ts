// Performance monitoring utilities

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string): void {
    this.metrics.set(label, performance.now());
  }

  endTimer(label: string): number {
    const startTime = this.metrics.get(label);
    if (!startTime) {
      console.warn(`Timer '${label}' was not started`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.metrics.delete(label);
    
    // Log slow operations
    if (duration > 1000) {
      console.warn(`🐌 Slow operation detected: ${label} took ${Math.round(duration)}ms`);
    } else if (duration > 500) {
      console.log(`⚠️  ${label} took ${Math.round(duration)}ms`);
    } else {
      console.log(`✅ ${label} took ${Math.round(duration)}ms`);
    }
    
    return duration;
  }

  measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(label);
    return fn().finally(() => {
      this.endTimer(label);
    });
  }

  measureSync<T>(label: string, fn: () => T): T {
    this.startTimer(label);
    try {
      return fn();
    } finally {
      this.endTimer(label);
    }
  }
}

export const perf = PerformanceMonitor.getInstance();

// Database query performance wrapper
export function withPerformanceLogging<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operationName: string
) {
  return async (...args: T): Promise<R> => {
    return perf.measureAsync(operationName, () => fn(...args));
  };
}

// API route performance wrapper
export function withApiPerformanceLogging<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  routeName: string
) {
  return async (...args: T): Promise<R> => {
    return perf.measureAsync(`API:${routeName}`, () => fn(...args));
  };
}

