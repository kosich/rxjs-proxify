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
});
