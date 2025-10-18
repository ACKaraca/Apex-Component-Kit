import { describe, it, expect, beforeEach } from 'vitest';
import { createReactive, watch, isReactive, clearWatchers } from '../src/reactivity';
import { computed } from '../src/effects';
import type { ReactiveObject } from '../src/reactivity';

describe('Reactivity System', () => {
  let state: ReactiveObject;

  beforeEach(() => {
    state = createReactive({
      count: 0,
      name: 'Test',
      nested: {
        value: 42
      }
    });
  });

  describe('createReactive', () => {
    it('should preserve initial values', () => {
      expect(state.count).toBe(0);
      expect(state.name).toBe('Test');
      expect(state.nested.value).toBe(42);
    });

    it('should allow property modification', () => {
      state.count = 5;
      expect(state.count).toBe(5);

      state.name = 'Updated';
      expect(state.name).toBe('Updated');
    });

    it('should handle nested objects', () => {
      state.nested.value = 100;
      expect(state.nested.value).toBe(100);
    });

    it('should handle array operations', () => {
      const reactive = createReactive({
        items: [1, 2, 3]
      });
      
      reactive.items.push(4);
      expect(reactive.items.length).toBe(4);
      expect(reactive.items[3]).toBe(4);
    });
  });

  describe('watch', () => {
    it('should trigger watch callback on property change', () => {
      let called = false;
      let newVal: any;

      watch(state, 'count', (n) => {
        called = true;
        newVal = n;
      });

      state.count = 10;
      expect(called).toBe(true);
      expect(newVal).toBe(10);
    });

    it('should allow unwatch', () => {
      let callCount = 0;
      const unwatch = watch(state, 'count', () => {
        callCount++;
      });

      state.count = 5;
      expect(callCount).toBe(1);

      unwatch();
      state.count = 10;
      expect(callCount).toBe(1);
    });

    it('should watch string properties', () => {
      let calls = 0;
      watch(state, 'name', () => {
        calls++;
      });

      state.name = 'First';
      state.name = 'Second';

      expect(calls).toBeGreaterThanOrEqual(1);
    });

    it('should allow multiple watchers on same property', () => {
      let count1 = 0;
      let count2 = 0;

      watch(state, 'count', () => { count1++; });
      watch(state, 'count', () => { count2++; });

      state.count = 10;

      expect(count1).toBeGreaterThanOrEqual(1);
      expect(count2).toBeGreaterThanOrEqual(1);
    });

    it('should watch wildcard changes', () => {
      let callCount = 0;
      watch(state, '*', () => {
        callCount++;
      });

      state.count = 5;
      state.name = 'Changed';

      expect(callCount).toBeGreaterThan(0);
    });
  });

  describe('clearWatchers', () => {
    it('should remove all watchers', () => {
      let count = 0;
      
      watch(state, 'count', () => { count++; });

      state.count = 5;
      const beforeClear = count;
      expect(beforeClear).toBeGreaterThanOrEqual(1);

      clearWatchers(state);

      state.count = 10;
      expect(count).toBe(beforeClear);
    });
  });

  describe('computed', () => {
    it('should create computed property with getter', () => {
      const reactive = createReactive({ x: 5, y: 10 });
      
      const getter = computed(() => reactive.x + reactive.y);
      const result = getter();
      expect(result).toBe(15);
    });

    it('should return callable getter function', () => {
      const reactive = createReactive({ x: 5 });
      
      const fn = computed(() => reactive.x * 2);
      
      expect(typeof fn).toBe('function');
      expect(fn()).toBe(10);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle watching during modification', () => {
      let cascades = 0;
      
      watch(state, 'count', (newVal) => {
        cascades++;
        if (cascades < 5) {
          state.count = newVal + 1;
        }
      });

      state.count = 1;
      expect(cascades).toBeGreaterThan(0);
    });

    it('should handle object reassignment', () => {
      let called = false;
      watch(state, 'nested', () => {
        called = true;
      });

      state.nested = { value: 999 };
      expect(called).toBe(true);
      expect(state.nested.value).toBe(999);
    });

    it('should handle mixed types', () => {
      const reactive = createReactive({
        str: 'hello',
        num: 42,
        bool: true,
        arr: [1, 2, 3],
        obj: { nested: 'value' }
      });

      expect(reactive.str).toBe('hello');
      expect(reactive.num).toBe(42);
      expect(reactive.bool).toBe(true);
      expect(reactive.arr.length).toBe(3);
      expect(reactive.obj.nested).toBe('value');
    });
  });
});
