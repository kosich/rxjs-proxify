import { Subject, Subscription } from 'rxjs';
import { proxify } from '../src/proxify';
import { createTestObserver, TestObserver } from './helpers';

describe.skip('Subject', () => {
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

});
