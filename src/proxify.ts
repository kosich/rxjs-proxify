import { BehaviorSubject, isObservable, Observable, Subject } from 'rxjs';
import { behaviorSubject } from './behavior';
import { BehaviorSubjectProxy, ObservableProxy, SubjectProxy } from './core/types';
import { observable } from './observable';
import { subject } from './subject';

export { BehaviorSubjectProxy, ObservableProxy, SubjectProxy };
export function proxify<O>(source: BehaviorSubject<O>): BehaviorSubjectProxy<O>;
export function proxify<O>(source: Subject<O>): SubjectProxy<O>;
export function proxify<O>(source: Observable<O>): ObservableProxy<O>;
export function proxify<O>(source: Observable<O>) {
  if (source instanceof BehaviorSubject) {
    return behaviorSubject(source as BehaviorSubject<O>);
  }

  if (source instanceof Subject) {
    return subject(source as Subject<O>);
  }

  if (isObservable(source)) {
    return observable(source as Observable<O>);
  }

  throw 'Source should be Observable, Subject, or BehaviorSubject';
}
