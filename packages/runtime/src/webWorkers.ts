/**
 * @ack/runtime - Web Workers Integration
 * Türkçe: Arka planda hesaplama için Web Workers sistemi
 */

// ============================================================================
// TYPES
// ============================================================================

export interface WorkerMessage<T = any> {
  type: string;
  data?: T;
  id?: string;
  error?: Error;
}

export interface WorkerTask<T = any, R = any> {
  id: string;
  type: string;
  data: T;
  resolve: (result: R) => void;
  reject: (error: Error) => void;
}

export interface WorkerConfig {
  maxConcurrentTasks?: number;
  timeout?: number;
  retryAttempts?: number;
  onError?: (error: Error) => void;
}

// ============================================================================
// WEB WORKER MANAGER
// ============================================================================

export class WebWorkerManager {
  private worker: Worker | null = null;
  private tasks: Map<string, WorkerTask> = new Map();
  private config: Required<WorkerConfig>;
  private isInitialized = false;

  constructor(workerScript: string | URL, config: WorkerConfig = {}) {
    this.config = {
      maxConcurrentTasks: 5,
      timeout: 30000,
      retryAttempts: 3,
      onError: (error) => console.error('Worker error:', error),
      ...config
    };

    this.initializeWorker(workerScript);
  }

  /**
   * Worker'ı başlat
   */
  private initializeWorker(workerScript: string | URL): void {
    try {
      this.worker = new Worker(workerScript, { type: 'module' });

      this.worker.onmessage = (event) => {
        this.handleWorkerMessage(event.data);
      };

      this.worker.onerror = (error) => {
        this.config.onError(new Error(`Worker error: ${error.message}`));
      };

      this.worker.onmessageerror = (error) => {
        this.config.onError(new Error(`Worker message error: ${error}`));
      };

      this.isInitialized = true;
    } catch (error) {
      this.config.onError(new Error(`Failed to create worker: ${error}`));
    }
  }

  /**
   * Task'ı çalıştır
   */
  async executeTask<T = any, R = any>(
    type: string,
    data: T,
    options: {
      timeout?: number;
      retryAttempts?: number;
    } = {}
  ): Promise<R> {
    if (!this.worker || !this.isInitialized) {
      throw new Error('Worker not initialized');
    }

    if (this.tasks.size >= this.config.maxConcurrentTasks) {
      throw new Error('Maximum concurrent tasks reached');
    }

    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return new Promise<R>((resolve, reject) => {
      const task: WorkerTask<T, R> = {
        id: taskId,
        type,
        data,
        resolve,
        reject
      };

      this.tasks.set(taskId, task);

      // Send task to worker
      const message: WorkerMessage<T> = {
        type: 'TASK_EXECUTE',
        data,
        id: taskId
      };

      this.worker!.postMessage(message);

      // Set timeout
      const timeout = options.timeout || this.config.timeout;
      setTimeout(() => {
        if (this.tasks.has(taskId)) {
          this.tasks.delete(taskId);
          reject(new Error(`Task ${taskId} timed out after ${timeout}ms`));
        }
      }, timeout);
    });
  }

  /**
   * Worker message'ını işle
   */
  private handleWorkerMessage(message: WorkerMessage): void {
    const { type, data, id, error } = message;

    switch (type) {
      case 'TASK_RESULT':
        this.handleTaskResult(id!, data);
        break;
      case 'TASK_ERROR':
        this.handleTaskError(id!, error!);
        break;
      default:
        console.warn('Unknown worker message type:', type);
    }
  }

  /**
   * Task result'ı işle
   */
  private handleTaskResult(taskId: string, result: any): void {
    const task = this.tasks.get(taskId);
    if (task) {
      this.tasks.delete(taskId);
      task.resolve(result);
    }
  }

  /**
   * Task error'ı işle
   */
  private handleTaskError(taskId: string, error: Error): void {
    const task = this.tasks.get(taskId);
    if (task) {
      this.tasks.delete(taskId);
      task.reject(error);
    }
  }

  /**
   * Tüm task'ları temizle
   */
  clearTasks(): void {
    this.tasks.clear();
  }

  /**
   * Worker'ı sonlandır
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      this.tasks.clear();
    }
  }

  /**
   * Worker durumunu kontrol et
   */
  isWorkerReady(): boolean {
    return this.isInitialized && this.worker !== null;
  }

  /**
   * Aktif task sayısını al
   */
  getActiveTaskCount(): number {
    return this.tasks.size;
  }
}

// ============================================================================
// WORKER TASK EXECUTOR
// ============================================================================

/**
 * Worker içinde çalışacak task executor
 */
export class WorkerTaskExecutor {
  private tasks: Map<string, (data: any) => Promise<any>> = new Map();

  constructor() {
    // Setup message listener
    self.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  /**
   * Task kaydet
   */
  registerTask(type: string, handler: (data: any) => Promise<any>): void {
    this.tasks.set(type, handler);
  }

  /**
   * Message'ı işle
   */
  private async handleMessage(message: WorkerMessage): Promise<void> {
    const { type, data, id } = message;

    try {
      if (type === 'TASK_EXECUTE') {
        await this.executeTask(id!, data);
      }
    } catch (error) {
      this.sendError(id!, error as Error);
    }
  }

  /**
   * Task'ı çalıştır
   */
  private async executeTask(taskId: string, data: any): Promise<void> {
    // This should be overridden in actual worker scripts
    // For now, send back the data as-is
    this.sendResult(taskId, data);
  }

  /**
   * Result gönder
   */
  protected sendResult(taskId: string, result: any): void {
    const message: WorkerMessage = {
      type: 'TASK_RESULT',
      data: result,
      id: taskId
    };

    self.postMessage(message);
  }

  /**
   * Error gönder
   */
  protected sendError(taskId: string, error: Error): void {
    const message: WorkerMessage = {
      type: 'TASK_ERROR',
      error,
      id: taskId
    };

    self.postMessage(message);
  }
}

// ============================================================================
// BUILT-IN WORKER TASKS
// ============================================================================

/**
 * CPU intensive calculation task
 */
export const cpuIntensiveTask = {
  type: 'CPU_INTENSIVE',
  handler: async (data: { operation: string; input: any }) => {
    const { operation, input } = data;

    switch (operation) {
      case 'fibonacci':
        return fibonacci(input.n);
      case 'factorial':
        return factorial(input.n);
      case 'prime-check':
        return isPrime(input.n);
      default:
        throw new Error(`Unknown CPU operation: ${operation}`);
    }
  }
};

/**
 * Data processing task
 */
export const dataProcessingTask = {
  type: 'DATA_PROCESSING',
  handler: async (data: { operation: string; input: any[]; threshold?: number }) => {
    const { operation, input, threshold } = data;

    switch (operation) {
      case 'sort':
        return input.sort((a, b) => a - b);
      case 'filter':
        return input.filter(item => threshold ? item > threshold : item > 0);
      case 'map':
        return input.map(item => item * 2);
      case 'reduce':
        return input.reduce((sum, item) => sum + item, 0);
      default:
        throw new Error(`Unknown data operation: ${operation}`);
    }
  }
};

/**
 * Image processing task
 */
export const imageProcessingTask = {
  type: 'IMAGE_PROCESSING',
  handler: async (data: { operation: string; imageData: ImageData }) => {
    const { operation, imageData } = data;

    switch (operation) {
      case 'grayscale':
        return applyGrayscaleFilter(imageData);
      case 'blur':
        return applyBlurFilter(imageData);
      case 'edge-detection':
        return applyEdgeDetection(imageData);
      default:
        throw new Error(`Unknown image operation: ${operation}`);
    }
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Fibonacci calculation
 */
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

/**
 * Factorial calculation
 */
function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

/**
 * Prime check
 */
function isPrime(n: number): boolean {
  if (n <= 1) return false;
  if (n <= 3) return true;

  if (n % 2 === 0 || n % 3 === 0) return false;

  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }

  return true;
}

/**
 * Grayscale filter
 */
function applyGrayscaleFilter(imageData: ImageData): ImageData {
  const data = imageData.data;
  const length = data.length;

  for (let i = 0; i < length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  return imageData;
}

/**
 * Blur filter (simple box blur)
 */
function applyBlurFilter(imageData: ImageData): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new Uint8ClampedArray(data.length);

  const kernel = [
    1, 1, 1,
    1, 1, 1,
    1, 1, 1
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = x + kx;
          const py = y + ky;

          if (px >= 0 && px < width && py >= 0 && py < height) {
            const offset = (py * width + px) * 4;
            const weight = kernel[(ky + 1) * 3 + (kx + 1)];

            r += data[offset] * weight;
            g += data[offset + 1] * weight;
            b += data[offset + 2] * weight;
            a += data[offset + 3] * weight;
          }
        }
      }

      const offset = (y * width + x) * 4;
      output[offset] = r / 9;
      output[offset + 1] = g / 9;
      output[offset + 2] = b / 9;
      output[offset + 3] = a / 9;
    }
  }

  return new ImageData(output, width, height);
}

/**
 * Edge detection filter (Sobel operator)
 */
function applyEdgeDetection(imageData: ImageData): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new Uint8ClampedArray(data.length);

  const sobelX = [
    -1, 0, 1,
    -2, 0, 2,
    -1, 0, 1
  ];

  const sobelY = [
    -1, -2, -1,
     0,  0,  0,
     1,  2,  1
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let gx = 0, gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = x + kx;
          const py = y + ky;

          if (px >= 0 && px < width && py >= 0 && py < height) {
            const offset = (py * width + px) * 4;
            const gray = data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;

            gx += gray * sobelX[(ky + 1) * 3 + (kx + 1)];
            gy += gray * sobelY[(ky + 1) * 3 + (kx + 1)];
          }
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const offset = (y * width + x) * 4;

      const edge = Math.min(255, magnitude);
      output[offset] = edge;
      output[offset + 1] = edge;
      output[offset + 2] = edge;
      output[offset + 3] = 255;
    }
  }

  return new ImageData(output, width, height);
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Web Worker Manager oluştur
 */
export function createWebWorkerManager(
  workerScript: string | URL,
  config?: WorkerConfig
): WebWorkerManager {
  return new WebWorkerManager(workerScript, config);
}

/**
 * Worker Task Executor oluştur (worker içinde kullanılacak)
 */
export function createWorkerTaskExecutor(): WorkerTaskExecutor {
  return new WorkerTaskExecutor();
}

/**
 * Worker script generator
 */
export function generateWorkerScript(tasks: Array<{ type: string; handler: string }>): string {
  return `
    ${WorkerTaskExecutor.toString()}

    class CustomWorkerTaskExecutor extends WorkerTaskExecutor {
      constructor() {
        super();

        ${tasks.map(task => `
          this.registerTask('${task.type}', ${task.handler});
        `).join('\n')}
      }

      async executeTask(taskId, data) {
        const task = this.tasks.get(data.type);
        if (!task) {
          throw new Error(\`Unknown task type: \${data.type}\`);
        }

        const result = await task(data.data);
        this.sendResult(taskId, result);
      }
    }

    new CustomWorkerTaskExecutor();
  `;
}

// Note: cpuIntensiveTask, dataProcessingTask, and imageProcessingTask are already exported above
