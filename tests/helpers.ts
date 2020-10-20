import { Observer } from "rxjs";

export interface TestObserver<T> extends Observer<T> {
  reset: () => void;
  next: jest.Mock;
  error: jest.Mock;
  complete: jest.Mock;
}

export function createTestObserver<T>(): TestObserver<T> {
  const o = {
    reset(){
      o.next.mockReset();
      o.error.mockReset();
      o.complete.mockReset();
    },
    next: jest.fn(),
    error: jest.fn(),
    complete: jest.fn()
  };

  return o;
}

export function resetTestObservers(...ts: TestObserver<any>[]) {
  ts.forEach(t => t.reset())
}
