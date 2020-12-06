import { Subject, Subscription } from 'rxjs';
import { proxify } from '../src';
import { createTestObserver, TestObserver } from './helpers';

describe('Subject', () => {
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

  test('basic', () => {
    const state = proxify(new Subject<number>());
    state.subscribe(observer);
    expect(observer.next).not.toHaveBeenCalled();
    state.next(0);
    expect(observer.next).toHaveBeenCalledWith(0);
    state.next(1);
    expect(observer.next).toHaveBeenCalledWith(1);
  });

  test('disabled Subject api on deeper levels', () => {
    const state = proxify(new Subject<{ a: { next: number; error: () => void } }>());
    state.a.next.subscribe(observer);
    expect(observer.next).not.toHaveBeenCalled();
    state.next({ a: { next: 0, error: () => {} } });
    expect(observer.next).toHaveBeenCalledWith(0);
    state.a.error();
    expect(observer.error).not.toHaveBeenCalled();
    state.next({ a: { next: 1, error: () => {} } });
    expect(observer.next).toHaveBeenCalledWith(1);
  });
});
