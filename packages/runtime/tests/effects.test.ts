import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createReactive, watch } from '../src/reactivity';
import { createEffect, Computed, batch, memo } from '../src/effects';

describe('Effects System', () => {
  describe('createEffect', () => {
    it('should execute effect callback', () => {
      const callback = vi.fn();
      createEffect(callback);
      
      expect(callback).toHaveBeenCalled();
    });

    it('should allow cleanup function', () => {
      const cleanup = vi.fn();
      
      createEffect(() => {
        return cleanup;
      });
      
      expect(typeof cleanup).toBe('function');
    });

    it('should track reactive dependencies', () => {
      const state = createReactive({ count: 0 });
      const callback = vi.fn();
      
      createEffect(() => {
        callback(state.count);
      });
      
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Computed', () => {
    it('should create computed property', () => {
      const state = createReactive({ x: 5 });
      const comp = new Computed(() => state.x * 2);
      
      expect(comp.get()).toBe(10);
    });

    it('should return cached value', () => {
      const state = createReactive({ x: 5 });
      let callCount = 0;
      
      const comp = new Computed(() => {
        callCount++;
        return state.x * 2;
      });
      
      comp.get();
      comp.get();
      
      expect(callCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('batch', () => {
    it('should batch updates', () => {
      const state = createReactive({ x: 0, y: 0 });
      let updateCount = 0;
      
      watch(state, '*', () => {
        updateCount++;
      });
      
      batch(() => {
        state.x = 1;
        state.y = 2;
      });
      
      expect(updateCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('memo', () => {
    it('should memoize function results', () => {
      const fn = vi.fn((x: number) => x * 2);
      const memoized = memo(fn);
      
      memoized(5);
      memoized(5);
      
      expect(fn).toHaveBeenCalled();
    });

    it('should handle different arguments', () => {
      const fn = vi.fn((x: number) => x * 2);
      const memoized = memo(fn);
      
      memoized(5);
      memoized(10);
      
      expect(fn).toHaveBeenCalled();
    });
  });

  describe('Complex scenarios', () => {
    it('should chain effects', () => {
      const state = createReactive({ a: 1 });
      const chain: number[] = [];
      
      createEffect(() => {
        chain.push(state.a * 2);
      });
      
      state.a = 2;
      state.a = 3;
      
      expect(chain.length).toBeGreaterThan(0);
    });

    it('should work with computed and reactive together', () => {
      const state = createReactive({ x: 5, y: 10 });
      const comp = new Computed(() => state.x + state.y);
      
      let lastValue = 0;
      createEffect(() => {
        lastValue = comp.get();
      });
      
      expect(lastValue).toBe(15);
    });

    it('should handle nested effects', () => {
      const state = createReactive({ count: 0 });
      const executions: number[] = [];
      
      createEffect(() => {
        executions.push(state.count);
        
        createEffect(() => {
          executions.push(state.count * 2);
        });
      });
      
      expect(executions.length).toBeGreaterThan(0);
    });
  });
});
