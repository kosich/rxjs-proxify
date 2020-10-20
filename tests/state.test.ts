import { Subscription } from 'rxjs';
import { statify } from '../src/state';
import { StateProxy } from '../src/types';
import { createTestObserver, resetTestObservers, TestObserver } from './helpers';

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

  test('Atomic', () => {
    const state = statify(0);
    state.subscribe(observer);
    expect(observer.next).toHaveBeenCalledWith(0);
    state.next(1);
    expect(observer.next).toHaveBeenCalledWith(1);
  });

  test('Simple object', () => {
    const state = statify({ a: 0 });
    sub = state.a.subscribe(observer);
    expect(observer.next).toHaveBeenCalledWith(0);
    state.a.next(1);
    expect(observer.next).toHaveBeenCalledWith(1);
    state.next({ a: 1 });
    expect(observer.next).toHaveBeenCalledWith(1);
  });

  describe('Compound object', () => {
    let state: StateProxy<{ a: number, b: { c: string }, z: number[] }>;
    let ao: TestObserver<unknown>;
    let bo: TestObserver<unknown>;
    let co: TestObserver<unknown>;
    let z1o: TestObserver<unknown>;

    beforeEach(() => {
      state = statify({ a: 0, b: { c: 'I' }, z: [0, 1, 2] });
      ao = createTestObserver();
      bo = createTestObserver();
      co = createTestObserver();
      z1o = createTestObserver();
      sub = new Subscription();
      sub.add(state.a.subscribe(ao));
      sub.add(state.b.subscribe(bo));
      sub.add(state.b.c.subscribe(co));
      sub.add(state.z[1].subscribe(z1o));
    });

    it('initial values', () => {
      expect(ao.next).toHaveBeenCalledWith(0);
      expect(bo.next).toHaveBeenCalledWith({ c: 'I' });
      expect(co.next).toHaveBeenCalledWith('I');
      expect(z1o.next).toHaveBeenCalledWith(1);
    });

    it('update substate', () => {
      resetTestObservers(ao, bo, co, z1o);
      state.b.c.next('II');
      expect(ao.next).not.toHaveBeenCalled();
      expect(bo.next).toHaveBeenCalledWith({ c: 'II' });
      expect(co.next).toHaveBeenCalledWith('II');
      expect(z1o.next).not.toHaveBeenCalled();
    });

    it('update substate', () => {
      resetTestObservers(ao, bo, co, z1o);
      // repeated update
      state.a.next(0);
      expect(ao.next).not.toHaveBeenCalled();
      expect(bo.next).not.toHaveBeenCalled();
      expect(co.next).not.toHaveBeenCalled();
      expect(z1o.next).not.toHaveBeenCalled();
    });

    // NOTE: state.z[1].next(…) will fail
  });

  test('Story', () => {
    // create a state
    const state = statify({ a: '🐰', z: '🏡' });

    // listen to & log state changes
    state.subscribe(observer);
    expect(observer.next).toHaveBeenCalledWith({ a: '🐰', z: '🏡' })

    // update particular substate
    state.a.next('🐇');
    expect(observer.next).toHaveBeenCalledWith({ a: '🐇', z: '🏡' })

    // update root state
    state.next({ a: '🐇', z: '☁️' })
    expect(observer.next).toHaveBeenCalledWith({ a: '🐇', z: '☁️' });

    // and then…
    state.z.next('🌙'); //> { a:🐇  z:🌙 }
    // TODO: TS does not supported yet
    // state.a += '👀';    //> { a:🐇👀 z:🌙 }
    state.z.next('🛸')  //> { a:🐇👀 z:🛸 }
    state.a.next('💨'); //> { a:💨  z:🛸 }

    // read current values
    expect(state.a.value + state.z.getValue()).toBe('💨🛸');
  })
});
