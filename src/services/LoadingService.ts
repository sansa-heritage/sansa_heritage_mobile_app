import eventBus from './eventBus';

// Define loading events
export const LOADING_EVENTS = {
  SHOW: 'LOADING_SHOW',
  HIDE: 'LOADING_HIDE',
} as const;

class LoadingService {
  private static instance: LoadingService;
  private loadingCount: number = 0;

  private constructor() {}

  static getInstance(): LoadingService {
    if (!LoadingService.instance) {
      LoadingService.instance = new LoadingService();
    }
    return LoadingService.instance;
  }

  /**
   * Show loading indicator
   * @param message - Optional loading message
   */
  show(message?: string): void {
    this.loadingCount++;
    eventBus.emit(LOADING_EVENTS.SHOW, { 
      message: message || 'Loading...',
      count: this.loadingCount 
    });
  }

  /**
   * Hide loading indicator
   */
  hide(): void {
    if (this.loadingCount > 0) {
      this.loadingCount--;
    }
    if (this.loadingCount === 0) {
      eventBus.emit(LOADING_EVENTS.HIDE);
    }
  }

  /**
   * Reset loading state (force hide)
   */
  reset(): void {
    this.loadingCount = 0;
    eventBus.emit(LOADING_EVENTS.HIDE);
  }

  /**
   * Check if loading is active
   */
  isLoading(): boolean {
    return this.loadingCount > 0;
  }

  /**
   * Get current loading count
   */
  getLoadingCount(): number {
    return this.loadingCount;
  }
}

export default LoadingService.getInstance();