/**
 * @ack/runtime - Virtual Scrolling System
 * Türkçe: Büyük listeler için performans optimizasyonu - virtual scrolling
 */

// ============================================================================
// TYPES
// ============================================================================

export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  scrollThreshold?: number;
  horizontal?: boolean;
}

export interface VirtualScrollItem {
  index: number;
  data: any;
  height: number;
  top: number;
  isVisible: boolean;
}

export interface VirtualScrollState {
  scrollTop: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
  totalHeight: number;
  visibleItems: VirtualScrollItem[];
}

export interface RenderComponentProps<T = any> {
  item: T;
  index: number;
  style?: any;
}

// ============================================================================
// VIRTUAL SCROLL MANAGER
// ============================================================================

export class VirtualScrollManager {
  private config: Required<VirtualScrollConfig>;
  private items: any[] = [];
  private state: VirtualScrollState = {
    scrollTop: 0,
    visibleStartIndex: 0,
    visibleEndIndex: 0,
    totalHeight: 0,
    visibleItems: []
  };
  private container: HTMLElement | null = null;
  private scrollElement: HTMLElement | null = null;
  private renderComponent?: (props: RenderComponentProps) => any;
  private itemHeightCache: Map<number, number> = new Map();

  constructor(config: VirtualScrollConfig) {
    this.config = {
      overscan: 5,
      scrollThreshold: 100,
      horizontal: false,
      ...config
    };
  }

  /**
   * Container element'i ayarla
   */
  setContainer(container: HTMLElement): void {
    this.container = container;
    this.setupScrollListener();
  }

  /**
   * Scroll element'i ayarla
   */
  setScrollElement(element: HTMLElement): void {
    this.scrollElement = element;
    this.setupScrollListener();
  }

  /**
   * Render component'i ayarla
   */
  setRenderComponent(renderFn: (props: RenderComponentProps) => any): void {
    this.renderComponent = renderFn;
  }

  /**
   * Items'ı ayarla
   */
  setItems(items: any[]): void {
    this.items = items;
    this.calculateTotalHeight();
    this.updateVisibleRange();
  }

  /**
   * Scroll pozisyonunu güncelle
   */
  updateScrollPosition(scrollTop: number): void {
    if (this.state.scrollTop === scrollTop) return;

    this.state.scrollTop = scrollTop;
    this.updateVisibleRange();
    this.renderVisibleItems();
  }

  /**
   * Toplam yüksekliği hesapla
   */
  private calculateTotalHeight(): void {
    if (this.items.length === 0) {
      this.state.totalHeight = 0;
      return;
    }

    // Estimate total height based on item heights
    let totalHeight = 0;
    for (let i = 0; i < this.items.length; i++) {
      const height = this.getItemHeight(i);
      totalHeight += height;
    }

    this.state.totalHeight = totalHeight;
  }

  /**
   * Item yüksekliğini al/cache et
   */
  private getItemHeight(index: number): number {
    if (this.itemHeightCache.has(index)) {
      return this.itemHeightCache.get(index)!;
    }

    const height = this.config.itemHeight; // Default height
    this.itemHeightCache.set(index, height);
    return height;
  }

  /**
   * Visible range'i güncelle
   */
  private updateVisibleRange(): void {
    const { scrollTop, totalHeight, visibleItems } = this.state;
    const { containerHeight, overscan } = this.config;

    // Calculate visible range
    const visibleStart = Math.max(0, Math.floor(scrollTop / this.config.itemHeight) - overscan);
    const visibleEnd = Math.min(
      this.items.length - 1,
      Math.floor((scrollTop + containerHeight) / this.config.itemHeight) + overscan
    );

    this.state.visibleStartIndex = visibleStart;
    this.state.visibleEndIndex = visibleEnd;

    // Update visible items
    this.state.visibleItems = [];
    for (let i = visibleStart; i <= visibleEnd; i++) {
      if (i < this.items.length) {
        const itemTop = this.calculateItemTop(i);
        this.state.visibleItems.push({
          index: i,
          data: this.items[i],
          height: this.getItemHeight(i),
          top: itemTop,
          isVisible: true
        });
      }
    }
  }

  /**
   * Item'ın top pozisyonunu hesapla
   */
  private calculateItemTop(index: number): number {
    let top = 0;
    for (let i = 0; i < index; i++) {
      top += this.getItemHeight(i);
    }
    return top;
  }

  /**
   * Visible item'ları render et
   */
  private renderVisibleItems(): void {
    if (!this.container || !this.renderComponent) return;

    // Clear existing content
    this.container.innerHTML = '';

    // Render visible items
    this.state.visibleItems.forEach(item => {
      if (this.renderComponent) {
        const itemElement = this.renderComponent({
          item: item.data,
          index: item.index,
          style: {
            position: 'absolute',
            top: `${item.top}px`,
            height: `${item.height}px`,
            width: '100%',
            [this.config.horizontal ? 'left' : 'top']: `${item.top}px`
          }
        });

        if (itemElement && itemElement.element) {
          this.container!.appendChild(itemElement.element);
        }
      }
    });
  }

  /**
   * Scroll listener'ı ayarla
   */
  private setupScrollListener(): void {
    const scrollElement = this.scrollElement || this.container;
    if (!scrollElement) return;

    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      const scrollTop = target.scrollTop;
      this.updateScrollPosition(scrollTop);
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
  }

  /**
   * Resize observer ayarla
   */
  setupResizeObserver(): void {
    if (!this.container || typeof ResizeObserver === 'undefined') return;

    const resizeObserver = new ResizeObserver(() => {
      this.updateVisibleRange();
      this.renderVisibleItems();
    });

    resizeObserver.observe(this.container);
  }

  /**
   * State'i al
   */
  getState(): VirtualScrollState {
    return { ...this.state };
  }

  /**
   * Item'ı güncelle
   */
  updateItem(index: number, data: any): void {
    if (index >= 0 && index < this.items.length) {
      this.items[index] = data;
      this.calculateTotalHeight();
      this.updateVisibleRange();
      this.renderVisibleItems();
    }
  }

  /**
   * Item ekle
   */
  insertItem(index: number, data: any): void {
    if (index >= 0 && index <= this.items.length) {
      this.items.splice(index, 0, data);
      this.calculateTotalHeight();
      this.updateVisibleRange();
      this.renderVisibleItems();
    }
  }

  /**
   * Item'ı kaldır
   */
  removeItem(index: number): void {
    if (index >= 0 && index < this.items.length) {
      this.items.splice(index, 1);
      this.calculateTotalHeight();
      this.updateVisibleRange();
      this.renderVisibleItems();
    }
  }

  /**
   * Tüm item'ları temizle
   */
  clear(): void {
    this.items = [];
    this.state = {
      scrollTop: 0,
      visibleStartIndex: 0,
      visibleEndIndex: 0,
      totalHeight: 0,
      visibleItems: []
    };

    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  /**
   * Scroll to specific index
   */
  scrollToIndex(index: number, align: 'start' | 'center' | 'end' = 'start'): void {
    if (!this.container || index < 0 || index >= this.items.length) return;

    const itemTop = this.calculateItemTop(index);
    const itemHeight = this.getItemHeight(index);
    const { containerHeight } = this.config;

    let scrollTop = itemTop;

    switch (align) {
      case 'center':
        scrollTop = itemTop - containerHeight / 2 + itemHeight / 2;
        break;
      case 'end':
        scrollTop = itemTop - containerHeight + itemHeight;
        break;
    }

    if (this.scrollElement) {
      this.scrollElement.scrollTop = Math.max(0, scrollTop);
    } else if (this.container) {
      this.container.scrollTop = Math.max(0, scrollTop);
    }
  }
}

// ============================================================================
// VIRTUAL SCROLL COMPONENT
// ============================================================================

export interface VirtualScrollProps<T = any> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (props: RenderComponentProps<T>) => any;
  overscan?: number;
  className?: string;
  style?: any;
}

export class VirtualScrollComponent<T = any> {
  private manager: VirtualScrollManager;
  private props: VirtualScrollProps<T>;

  constructor(props: VirtualScrollProps<T>) {
    this.props = props;
    this.manager = new VirtualScrollManager({
      itemHeight: props.itemHeight,
      containerHeight: props.containerHeight,
      overscan: props.overscan
    });

    this.manager.setRenderComponent(props.renderItem);
  }

  /**
   * Component'i render et
   */
  render(): any {
    const { items, className, style } = this.props;

    this.manager.setItems(items);

    return {
      element: (() => {
        const container = document.createElement('div');
        container.className = `ack-virtual-scroll ${className || ''}`;
        container.style.cssText = `
          height: ${this.props.containerHeight}px;
          overflow: auto;
          position: relative;
          ${style || ''}
        `;

        // Set container and render initial items
        this.manager.setContainer(container);
        // renderVisibleItems is private, we'll call it through the manager's public interface
        this.manager.setItems(items);

        return container;
      })(),
      manager: this.manager
    };
  }

  /**
   * Props'u güncelle
   */
  updateProps(newProps: Partial<VirtualScrollProps<T>>): void {
    this.props = { ...this.props, ...newProps };
    this.manager = new VirtualScrollManager({
      itemHeight: this.props.itemHeight,
      containerHeight: this.props.containerHeight,
      overscan: this.props.overscan
    });
  }

  /**
   * Manager'a erişim
   */
  getManager(): VirtualScrollManager {
    return this.manager;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Virtual Scroll Manager oluştur
 */
export function createVirtualScrollManager(config: VirtualScrollConfig): VirtualScrollManager {
  return new VirtualScrollManager(config);
}

/**
 * Virtual Scroll Component oluştur
 */
export function createVirtualScrollComponent<T>(props: VirtualScrollProps<T>): VirtualScrollComponent<T> {
  return new VirtualScrollComponent(props);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Dynamic item height calculator
 */
export class DynamicHeightCalculator {
  private heightCache: Map<string, number> = new Map();
  private measuringElement: HTMLElement | null = null;

  /**
   * Measuring element oluştur
   */
  createMeasuringElement(): HTMLElement {
    if (!this.measuringElement) {
      this.measuringElement = document.createElement('div');
      this.measuringElement.style.cssText = `
        position: absolute;
        visibility: hidden;
        height: auto;
        width: 100%;
        top: -9999px;
        left: -9999px;
      `;
      document.body.appendChild(this.measuringElement);
    }
    return this.measuringElement;
  }

  /**
   * Item yüksekliğini ölç
   */
  measureItemHeight(item: any, renderFn: (item: any) => string): number {
    const measuringElement = this.createMeasuringElement();
    measuringElement.innerHTML = renderFn(item);

    const height = measuringElement.offsetHeight;

    // Cache the height
    const key = typeof item === 'object' ? JSON.stringify(item) : String(item);
    this.heightCache.set(key, height);

    return height;
  }

  /**
   * Cached height'i al
   */
  getCachedHeight(item: any): number | null {
    const key = typeof item === 'object' ? JSON.stringify(item) : String(item);
    return this.heightCache.get(key) || null;
  }

  /**
   * Cache'i temizle
   */
  clearCache(): void {
    this.heightCache.clear();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.measuringElement) {
      document.body.removeChild(this.measuringElement);
      this.measuringElement = null;
    }
    this.heightCache.clear();
  }
}

/**
 * Infinite scroll helper
 */
export class InfiniteScrollHelper {
  private manager: VirtualScrollManager;
  private isLoading = false;
  private hasMore = true;

  constructor(manager: VirtualScrollManager) {
    this.manager = manager;
  }

  /**
   * Load more items
   */
  async loadMore(
    loadFn: (startIndex: number, limit: number) => Promise<any[]>,
    limit: number = 20
  ): Promise<void> {
    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;

    try {
      const currentItems = this.manager['items'];
      const startIndex = currentItems.length;
      const newItems = await loadFn(startIndex, limit);

      if (newItems.length < limit) {
        this.hasMore = false;
      }

      if (newItems.length > 0) {
        currentItems.push(...newItems);
        this.manager.setItems(currentItems);
      }
    } catch (error) {
      console.error('Failed to load more items:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Setup scroll threshold listener
   */
  setupThresholdListener(threshold: number = 100): void {
    const container = this.manager['container'];
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, totalHeight } = this.manager.getState();
      const { containerHeight } = this.manager['config'];

      const distanceToBottom = totalHeight - scrollTop - containerHeight;

      if (distanceToBottom < threshold && this.hasMore) {
        this.loadMore(() => Promise.resolve([])); // This should be replaced with actual load function
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
  }

  /**
   * State kontrolü
   */
  getState() {
    return {
      isLoading: this.isLoading,
      hasMore: this.hasMore
    };
  }
}

/**
 * Performance measurement utility
 */
export function measureVirtualScrollPerformance<T>(
  items: T[],
  renderFn: (item: T, index: number) => any,
  config: VirtualScrollConfig
): {
  renderTime: number;
  memoryUsage: number;
  domNodes: number;
} {
  const startTime = performance.now();
  const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

  // Simulate rendering
  const manager = createVirtualScrollManager(config);
  manager.setItems(items);
  manager.setRenderComponent(({ item, index }) => renderFn(item, index));

  const endTime = performance.now();
  const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

  return {
    renderTime: endTime - startTime,
    memoryUsage: endMemory - startMemory,
    domNodes: manager.getState().visibleItems.length
  };
}
