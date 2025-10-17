/**
 * Mount System - Component bağlama sistemi
 * Türkçe: Bu modül, derlenmiş bileşenleri DOM'a bağlar ve yönetir.
 */

export interface ACKComponent {
  element: HTMLElement;
  mount(target: HTMLElement | string): void;
  destroy(): void;
  [key: string]: any;
}

/**
 * Bir bileşeni DOM'a bağla.
 */
export function mount(
  component: ACKComponent,
  target: HTMLElement | string
): HTMLElement {
  const targetElement =
    typeof target === 'string' ? document.querySelector(target) : target;

  if (!targetElement) {
    throw new Error(
      `Target element not found: ${typeof target === 'string' ? target : 'provided element'}`
    );
  }

  // Bileşen elementin'i hedef elementin'e ekle
  if (component.element) {
    targetElement.appendChild(component.element);
  }

  return component.element;
}

/**
 * Bir bileşeni DOM'dan kaldır ve temizle.
 */
export function unmount(component: ACKComponent): void {
  if (component.element && component.element.parentElement) {
    component.element.remove();
  }

  if (typeof component.destroy === 'function') {
    component.destroy();
  }
}

/**
 * Server-rendered HTML'i client tarafında hydrate et.
 */
export function hydrate(
  componentConstructor: any,
  targetSelector: string = '#app',
  initialProps: Record<string, any> = {}
): ACKComponent {
  const targetElement = document.querySelector(targetSelector);

  if (!targetElement) {
    throw new Error(`Target element not found: ${targetSelector}`);
  }

  // Server state'i ayıkla
  const stateElement = targetElement.querySelector('[data-ack-state]');
  const state = stateElement
    ? JSON.parse(stateElement.textContent || '{}')
    : {};

  // Component'i state ile oluştur
  const component = new componentConstructor({
    ...state,
    ...initialProps,
  });

  // Existing DOM'ı koruya while hydrating
  component.element = targetElement as HTMLElement;

  // Event listeners'ı restore et
  restoreEventListeners(component, targetElement);

  return component;
}

/**
 * Event listeners'ları restore et.
 */
function restoreEventListeners(
  component: ACKComponent,
  element: Element
): void {
  // Tüm event handlers'ı bul ve attach et
  const eventElements = element.querySelectorAll('[data-event]');

  eventElements.forEach((el) => {
    const eventType = el.getAttribute('data-event');
    const handlerName = el.getAttribute('data-handler');

    if (eventType && handlerName && component[handlerName]) {
      (el as HTMLElement).addEventListener(
        eventType,
        component[handlerName].bind(component)
      );
    }
  });
}

/**
 * Birden fazla bileşeni yönet.
 */
export class ComponentManager {
  private components: Map<string, ACKComponent> = new Map();

  /**
   * Bileşen ekle.
   */
  public add(id: string, component: ACKComponent): void {
    this.components.set(id, component);
  }

  /**
   * Bileşen al.
   */
  public get(id: string): ACKComponent | undefined {
    return this.components.get(id);
  }

  /**
   * Bileşeni mount et.
   */
  public mount(id: string, target: HTMLElement | string): void {
    const component = this.get(id);
    if (component) {
      mount(component, target);
    }
  }

  /**
   * Bileşeni unmount et.
   */
  public unmount(id: string): void {
    const component = this.get(id);
    if (component) {
      unmount(component);
      this.components.delete(id);
    }
  }

  /**
   * Tüm bileşenleri temizle.
   */
  public clear(): void {
    this.components.forEach((component) => {
      unmount(component);
    });
    this.components.clear();
  }

  /**
   * Tüm bileşenleri döndür.
   */
  public getAll(): Map<string, ACKComponent> {
    return this.components;
  }
}
