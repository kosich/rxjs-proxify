import { BehaviorSubject, Subscription } from 'rxjs';
import { BehaviorSubjectProxy, proxify } from '../src';
import { createTestObserver, resetTestObservers, TestObserver } from './helpers';

describe('Behavior', () => {
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
    const state = proxify(new BehaviorSubject(0));
    state.subscribe(observer);
    expect(observer.next).toHaveBeenCalledWith(0);
    state.next(1);
    expect(observer.next).toHaveBeenCalledWith(1);
  });

  test('Simple object', () => {
    const state = proxify(new BehaviorSubject({ a: 0 }));
    sub = state.a.subscribe(observer);
    expect(observer.next).toHaveBeenCalledWith(0);
    state.a.next(1);
    expect(observer.next).toHaveBeenCalledWith(1);
    state.next({ a: 1 });
    expect(observer.next).toHaveBeenCalledTimes(3);
    // repeated call
    state.a.next(1);
    expect(observer.next).toHaveBeenCalledTimes(4);
  });

  describe('Compound object', () => {
    let state: BehaviorSubjectProxy<{ a: number, b: { c: string }, z: number[] }>;
    let ao: TestObserver<unknown>;
    let bo: TestObserver<unknown>;
    let co: TestObserver<unknown>;
    let z1o: TestObserver<unknown>;

    beforeEach(() => {
      state = proxify(new BehaviorSubject({ a: 0, b: { c: 'I' }, z: [0, 1, 2] }));
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
      expect(bo.next).toHaveBeenCalledWith({ c: 'II' });
      expect(co.next).toHaveBeenCalledWith('II');
    });

    // NOTE: state.z[1].next(…) will fail
  });

});
