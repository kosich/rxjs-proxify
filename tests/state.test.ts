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

    it('Coerces to an array', () => {
      const state = statify({ a: [1, 2, 3] });

      const newArr = [...state.a, 4];

      expect(newArr).toStrictEqual([1, 2, 3, 4]);
    });

    it('Coerces elements of an array', () => {
      const state = statify({ a: [1, 2, 3] });
      expect(+state.a[2]).toBe(3);
    });

    it('Coerces a date to a number', () => {
      const date = new Date();
      const state = statify({ a: date });
      const coercedDate = new Date(state.a);
      expect(coercedDate.valueOf()).toBe(date.valueOf());
    });

    it('Coerces a boolean', () => {
      let state = statify({ a: true });
      expect(+state.a).toBeTruthy();
      state = statify({ a: false });
      expect(+state.a).toBeFalsy();
    });

    it('Coerces when JSON.stringify called', () => {
      const state = statify({ a: 2 });
      expect(JSON.stringify(state)).toBe('{"a":2}');
    });

    it('Coerces when spread', () => {
      const state = statify({ a: 2 });
      const newState = { ...state, b: 3 };
      expect(+newState.a).toBe(2);
    });

    it('Coerces when Object.assign', () => {
      const state = statify({ a: 2 });
      const newState = Object.assign({}, state, { b: 3 });
      expect(+newState.a).toBe(2);
    });
  });
});
