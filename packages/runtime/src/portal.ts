/**
 * @ack/runtime - Portal System
 * Türkçe: DOM'da farklı yerlere render etme sistemi
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PortalConfig {
  container?: Element | string;
  onMount?: (element: Element) => void;
  onUnmount?: (element: Element) => void;
  multiple?: boolean;
}

export interface PortalInstance {
  id: string;
  element: Element;
  container: Element;
  isMounted: boolean;
  config: PortalConfig;
}

export interface PortalManagerState {
  portals: Map<string, PortalInstance>;
  containers: Map<Element, Set<string>>;
}

// ============================================================================
// PORTAL MANAGER
// ============================================================================

export class PortalManager {
  private state: PortalManagerState = {
    portals: new Map(),
    containers: new Map()
  };
  private config: PortalConfig = {};

  constructor(config: PortalConfig = {}) {
    this.config = config;
  }

  /**
   * Portal oluştur
   */
  createPortal(
    id: string,
    content: Element | (() => Element),
    container?: Element | string,
    config: PortalConfig = {}
  ): PortalInstance {
    const containerElement = this.resolveContainer(container);
    const contentElement = typeof content === 'function' ? content() : content;

    const mergedConfig = { ...this.config, ...config };

    const portal: PortalInstance = {
      id,
      element: contentElement,
      container: containerElement,
      isMounted: false,
      config: mergedConfig
    };

    this.state.portals.set(id, portal);

    // Track container usage
    if (!this.state.containers.has(containerElement)) {
      this.state.containers.set(containerElement, new Set());
    }
    this.state.containers.get(containerElement)!.add(id);

    return portal;
  }

  /**
   * Portal'ı mount et
   */
  mountPortal(id: string): boolean {
    const portal = this.state.portals.get(id);
    if (!portal || portal.isMounted) return false;

    try {
      portal.container.appendChild(portal.element);
      portal.isMounted = true;

      portal.config.onMount?.(portal.element);

      return true;
    } catch (error) {
      console.error(`Failed to mount portal ${id}:`, error);
      return false;
    }
  }

  /**
   * Portal'ı unmount et
   */
  unmountPortal(id: string): boolean {
    const portal = this.state.portals.get(id);
    if (!portal || !portal.isMounted) return false;

    try {
      portal.container.removeChild(portal.element);
      portal.isMounted = false;

      portal.config.onUnmount?.(portal.element);

      return true;
    } catch (error) {
      console.error(`Failed to unmount portal ${id}:`, error);
      return false;
    }
  }

  /**
   * Portal'ı güncelle
   */
  updatePortal(id: string, content: Element | (() => Element)): boolean {
    const portal = this.state.portals.get(id);
    if (!portal) return false;

    const newElement = typeof content === 'function' ? content() : content;

    if (portal.isMounted) {
      portal.container.replaceChild(newElement, portal.element);
    }

    portal.element = newElement;

    return true;
  }

  /**
   * Portal'ı tamamen kaldır
   */
  removePortal(id: string): boolean {
    const portal = this.state.portals.get(id);
    if (!portal) return false;

    if (portal.isMounted) {
      this.unmountPortal(id);
    }

    this.state.portals.delete(id);

    // Remove from container tracking
    const containerPortals = this.state.containers.get(portal.container);
    if (containerPortals) {
      containerPortals.delete(id);
      if (containerPortals.size === 0) {
        this.state.containers.delete(portal.container);
      }
    }

    return true;
  }

  /**
   * Tüm portal'ları temizle
   */
  clearAll(): void {
    const portalIds = Array.from(this.state.portals.keys());
    portalIds.forEach(id => this.removePortal(id));
  }

  /**
   * Portal'ı al
   */
  getPortal(id: string): PortalInstance | undefined {
    return this.state.portals.get(id);
  }

  /**
   * Tüm portal'ları listele
   */
  getAllPortals(): PortalInstance[] {
    return Array.from(this.state.portals.values());
  }

  /**
   * Container'daki portal'ları al
   */
  getPortalsInContainer(container: Element): PortalInstance[] {
    const portalIds = this.state.containers.get(container);
    if (!portalIds) return [];

    return Array.from(portalIds)
      .map(id => this.state.portals.get(id))
      .filter((portal): portal is PortalInstance => portal !== undefined);
  }

  /**
   * Container'ı çöz
   */
  private resolveContainer(container?: Element | string): Element {
    if (container instanceof Element) {
      return container;
    }

    if (typeof container === 'string') {
      const element = document.querySelector(container);
      if (element) return element;

      // Create new container if it doesn't exist
      const newContainer = document.createElement('div');
      newContainer.id = container.startsWith('#') ? container.slice(1) : container;
      document.body.appendChild(newContainer);
      return newContainer;
    }

    // Default to document.body
    return document.body;
  }

  /**
   * Container'ı oluştur veya al
   */
  createContainer(id: string, parent: Element = document.body): Element {
    let container = document.getElementById(id);

    if (!container) {
      container = document.createElement('div');
      container.id = id;
      parent.appendChild(container);
    }

    return container;
  }
}

// ============================================================================
// PORTAL COMPONENT
// ============================================================================

export interface PortalProps {
  children: Element | (() => Element);
  container?: Element | string;
  isOpen?: boolean;
  onMount?: (element: Element) => void;
  onUnmount?: (element: Element) => void;
}

export class PortalComponent {
  private manager: PortalManager;
  private props: PortalProps;
  private portalId: string;
  private isComponentMounted = false;

  constructor(manager: PortalManager, props: PortalProps) {
    this.manager = manager;
    this.props = props;
    this.portalId = `portal-${Math.random().toString(36).substr(2, 9)}`;

    if (props.isOpen !== false) {
      this.mount();
    }
  }

  /**
   * Component'i mount et
   */
  mount(): void {
    if (this.isComponentMounted) return;

    this.isComponentMounted = true;

    const portal = this.manager.createPortal(
      this.portalId,
      this.props.children,
      this.props.container,
      {
        onMount: this.props.onMount,
        onUnmount: this.props.onUnmount
      }
    );

    this.manager.mountPortal(this.portalId);
  }

  /**
   * Component'i unmount et
   */
  unmount(): void {
    if (!this.isComponentMounted) return;

    this.isComponentMounted = false;
    this.manager.unmountPortal(this.portalId);
    this.manager.removePortal(this.portalId);
  }

  /**
   * Props'u güncelle
   */
  updateProps(newProps: Partial<PortalProps>): void {
    const prevProps = this.props;
    this.props = { ...this.props, ...newProps };

    // Handle isOpen changes
    if (prevProps.isOpen !== newProps.isOpen) {
      if (newProps.isOpen === true && !this.isComponentMounted) {
        this.mount();
      } else if (newProps.isOpen === false && this.isComponentMounted) {
        this.unmount();
      }
    }

    // Handle container changes
    if (prevProps.container !== newProps.container && this.isComponentMounted) {
      this.manager.unmountPortal(this.portalId);

      const portal = this.manager.getPortal(this.portalId);
      if (portal) {
        portal.container = this.manager['resolveContainer'](newProps.container);
        this.manager.mountPortal(this.portalId);
      }
    }

    // Handle children changes
    if (prevProps.children !== newProps.children && this.isComponentMounted && newProps.children) {
      this.manager.updatePortal(this.portalId, newProps.children);
    }
  }

  /**
   * Portal'ı al
   */
  getPortal(): PortalInstance | undefined {
    return this.manager.getPortal(this.portalId);
  }

  /**
   * Mount durumunu kontrol et
   */
  isMounted(): boolean {
    return this.isComponentMounted;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Portal Manager oluştur
 */
export function createPortalManager(config?: PortalConfig): PortalManager {
  return new PortalManager(config);
}

/**
 * Portal Component oluştur
 */
export function createPortalComponent(
  manager: PortalManager,
  props: PortalProps
): PortalComponent {
  return new PortalComponent(manager, props);
}

// ============================================================================
// REACT-STYLE PORTAL API
// ============================================================================

/**
 * React-style createPortal API
 */
export function createPortal(
  children: Element | (() => Element),
  container?: Element | string,
  key?: string | null
): PortalComponent {
  const manager = createPortalManager();
  return createPortalComponent(manager, { children, container, isOpen: true });
}

// ============================================================================
// BUILT-IN PORTALS
// ============================================================================

/**
 * Modal portal
 */
export function createModalPortal(
  content: Element | (() => Element),
  config: {
    container?: Element | string;
    backdrop?: boolean;
    onClose?: () => void;
  } = {}
): PortalComponent {
  const { backdrop = true, onClose } = config;

  const modalContent = () => {
    const modal = document.createElement('div');
    modal.className = 'ack-modal';

    if (backdrop) {
      modal.innerHTML = `
        <div class="ack-modal-backdrop" style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        ">
          <div class="ack-modal-content" style="
            background: white;
            border-radius: 8px;
            padding: 20px;
            max-width: 90%;
            max-height: 90%;
            overflow: auto;
          ">
            ${typeof content === 'function' ? '' : content.outerHTML}
          </div>
        </div>
      `;

      if (onClose) {
        const backdropElement = modal.querySelector('.ack-modal-backdrop');
        if (backdropElement) {
          backdropElement.addEventListener('click', (e) => {
            if (e.target === backdropElement) {
              onClose();
            }
          });
        }
      }
    } else {
      modal.appendChild(typeof content === 'function' ? content() : content);
    }

    return modal;
  };

  return createPortal(modalContent, config.container || 'body');
}

/**
 * Toast portal
 */
export function createToastPortal(
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
  duration: number = 5000
): PortalComponent {
  const toastContent = () => {
    const toast = document.createElement('div');
    toast.className = `ack-toast ack-toast-${type}`;

    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    toast.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background: ${colors[type]};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        margin-bottom: 8px;
        animation: slideIn 0.3s ease;
      ">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="
          margin-left: auto;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">&times;</button>
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;

    // Auto remove after duration
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, duration);

    return toast;
  };

  return createPortal(toastContent, '#toast-container');
}

/**
 * Tooltip portal
 */
export function createTooltipPortal(
  content: string,
  target: Element,
  position: 'top' | 'bottom' | 'left' | 'right' = 'top'
): PortalComponent {
  const tooltipContent = () => {
    const tooltip = document.createElement('div');
    tooltip.className = 'ack-tooltip';

    tooltip.innerHTML = `
      <div style="
        position: absolute;
        background: #333;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        white-space: nowrap;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
      ">
        ${content}
        <div style="
          position: absolute;
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          ${position === 'top' ? 'border-bottom: 5px solid #333; top: -5px;' : ''}
          ${position === 'bottom' ? 'border-top: 5px solid #333; bottom: -5px;' : ''}
          ${position === 'left' ? 'border-right: 5px solid #333; left: -5px;' : ''}
          ${position === 'right' ? 'border-left: 5px solid #333; right: -5px;' : ''}
        "></div>
      </div>
    `;

    // Position tooltip relative to target
    const targetRect = target.getBoundingClientRect();
    const tooltipDiv = tooltip.querySelector('div') as HTMLElement;

    switch (position) {
      case 'top':
        tooltipDiv.style.top = `${targetRect.top - 10}px`;
        tooltipDiv.style.left = `${targetRect.left + targetRect.width / 2}px`;
        tooltipDiv.style.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        tooltipDiv.style.top = `${targetRect.bottom + 10}px`;
        tooltipDiv.style.left = `${targetRect.left + targetRect.width / 2}px`;
        tooltipDiv.style.transform = 'translateX(-50%)';
        break;
      case 'left':
        tooltipDiv.style.top = `${targetRect.top + targetRect.height / 2}px`;
        tooltipDiv.style.left = `${targetRect.left - 10}px`;
        tooltipDiv.style.transform = 'translateY(-50%)';
        break;
      case 'right':
        tooltipDiv.style.top = `${targetRect.top + targetRect.height / 2}px`;
        tooltipDiv.style.left = `${targetRect.right + 10}px`;
        tooltipDiv.style.transform = 'translateY(-50%)';
        break;
    }

    // Show tooltip after positioning
    setTimeout(() => {
      tooltipDiv.style.opacity = '1';
    }, 10);

    return tooltip;
  };

  return createPortal(tooltipContent, document.body);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Portal utilities
 */
export const PortalUtils = {
  /**
   * Container'ı oluştur
   */
  createContainer(id: string, parent: Element = document.body): Element {
    const manager = createPortalManager();
    return manager.createContainer(id, parent);
  },

  /**
   * Tüm portal'ları temizle
   */
  clearAllPortals(): void {
    const manager = createPortalManager();
    manager.clearAll();
  },

  /**
   * Portal sayısını al
   */
  getPortalCount(): number {
    const manager = createPortalManager();
    return manager.getAllPortals().length;
  }
};

/**
 * Debug utility for portals
 */
export function debugPortals(): void {
  const manager = createPortalManager();
  const portals = manager.getAllPortals();

  console.group('🔍 Portal Debug');
  console.log(`Total portals: ${portals.length}`);

  portals.forEach(portal => {
    console.log(`Portal ${portal.id}:`, {
      isMounted: portal.isMounted,
      container: portal.container.tagName,
      element: portal.element.tagName
    });
  });

  console.groupEnd();
}
