import { Subscription } from 'rxjs';
import { BehaviorSubjectProxy, statify } from '../src';
import { createTestObserver, TestObserver } from './helpers';

describe('State', () => {
  let sub: Subscription;
  let observer: TestObserver<unknown>;

  beforeEach(() => {
    observer = createTestObserver<unknown>();
  });

  afterEach(() => {
    if (sub) {
      sub.unsubscribe();
    }
  });

  test('Story', () => {
    // create a state
    const state = statify({ a: '🐰', z: '🏡' });

    // listen to & log state changes
    sub = state.subscribe(observer);
    expect(observer.next).toHaveBeenCalledWith({ a: '🐰', z: '🏡' });

    // update particular substate
    state.a.next('🐇');
    expect(observer.next).toHaveBeenCalledWith({ a: '🐇', z: '🏡' });

    // update root state
    state.next({ a: '🐇', z: '☁️' });
    expect(observer.next).toHaveBeenCalledWith({ a: '🐇', z: '☁️' });

    // and then…
    state.z.next('🌙'); //> { a:🐇  z:🌙 }
    // TODO: TS does not supported yet
    // state.a += '👀';    //> { a:🐇👀 z:🌙 }
    state.z.next('🛸'); //> { a:🐇👀 z:🛸 }
    state.a.next('💨'); //> { a:💨  z:🛸 }

    // read current values
    expect(state.a.value + state.z.getValue()).toBe('💨🛸');
  });

  describe('skip repeated updates', () => {
    let state: BehaviorSubjectProxy<{ a: number }>;

    beforeEach(() => {
      state = statify({ a: 0 });
    });

    it('skip deep repeated updates', () => {
      sub = state.subscribe(observer);
      expect(observer.next).toHaveBeenCalledWith({ a: 0 });
      observer.mockReset();
      state.a.next(0);
      expect(observer.next).not.toHaveBeenCalled();
    });

    it('skip repeated updates', () => {
      sub = state.a.subscribe(observer);
      expect(observer.next).toHaveBeenCalledWith(0);
      observer.mockReset();
      state.a.next(0);
      expect(observer.next).not.toHaveBeenCalled();
    });
  });

  describe('Coercable statify', () => {
    it('Coerces to a string', () => {
      const state = statify({ hello: 'Hello, ' });
      expect(state.hello + 'world!').toBe('Hello, world!');
    });

    it('Coerces to a number', () => {
      const state = statify({ a: 10 });
      expect(state.a + 2).toBe(12);
    });

    /**
     * TODO: Figure out how to proxy [Symbol.iterator]
     * Here's a clue: https://stackoverflow.com/questions/41046085/v8-es6-proxies-dont-support-iteration-protocol-when-targeting-custom-objects
     *
     * As well as proxying the symbol, we may have to manually
     * proxy array props: 'length', '0', '1', ...
     */
    it.skip('Coerces to an array', () => {
      const state = statify({ a: [1, 2, 3] });
      expect([...state.a, 4]).toBe([1, 2, 3, 4]);
    });

    it.skip('Use elements of an array', () => {
      const state = statify({ a: [1, 2, 3] });
      expect(state.a[2]).toBe(3);
    });
  });
});
