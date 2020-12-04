import { BehaviorSubject, isObservable, Observable, Subject } from "rxjs";
import { behaviorSubject } from "./behavior";
import { BehaviorSubjectProxy, ObservableProxy, SubjectProxy } from "./core/types";
import { observable } from "./observable";
import { subject } from "./subject";

export { BehaviorSubjectProxy, ObservableProxy, SubjectProxy };
export function proxify<O, X = void>(source: BehaviorSubject<O>, x?: X): BehaviorSubjectProxy<O, X>;
export function proxify<O, X = void>(source: Subject<O>, x?: X): SubjectProxy<O, X>;
export function proxify<O, X = void>(source: Observable<O>, x?: X): ObservableProxy<O, X>;
export function proxify<O, X = void>(source: Observable<O>, x?: X) {
  if (source instanceof BehaviorSubject) {
    return behaviorSubject(source as BehaviorSubject<O>, x);
  }

  if (source instanceof Subject) {
    return subject(source as Subject<O>, x);
  }

  if (isObservable(source)) {
    return observable(source as Observable<O>, x);
  }

  throw 'Source should be Observable, Subject, or BehaviorSubject';
}

