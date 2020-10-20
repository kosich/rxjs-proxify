import { Observer } from "rxjs";

export interface TestObserver<T> extends Observer<T> {
  next: jest.Mock;
  error: jest.Mock;
  complete: jest.Mock;
}

export function createTestObserver<T>(): TestObserver<T> {
  return {
    next: jest.fn(),
    error: jest.fn(),
    complete: jest.fn()
  };
}
