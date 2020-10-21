import { BehaviorSubject, isObservable, Observable, Subject } from "rxjs";
import { distinctUntilChanged, pluck } from "rxjs/operators";
import { OBSERVABLE_INSTANCE_PROP_KEYS, stubFn } from "./shared";
import { BehaviorSubjectProxy, ObservableProxy, SubjectProxy } from "./types";

export { BehaviorSubjectProxy, ObservableProxy, SubjectProxy };
export function proxify<O>(source: BehaviorSubject<O>): BehaviorSubjectProxy<O>;
export function proxify<O>(source: Subject<O>): SubjectProxy<O>;
export function proxify<O>(source: Observable<O>): ObservableProxy<O>;
export function proxify<O>(source) {
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

function observable<O>(source$: Observable<O>): ObservableProxy<O> {
  return getSetProxy(source$, [], null, null) as ObservableProxy<O>;
}

function subject<O>(source$: Observable<O>): SubjectProxy<O> {
  return getSetProxy(source$, [], null, null) as SubjectProxy<O>;
}

function behaviorSubject<O>(source$: BehaviorSubject<O>): BehaviorSubjectProxy<O> {
  const getter = deepGetter(() => source$.value);
  const setter = deepSetter(
    () => source$.value,
    ns => {
      source$.next(ns);
    },
  );

  return getSetProxy(source$, [], getter, setter);
}

function getSetProxy<O>(s: Observable<O>, ps: Path, getter: Getter, setter: Setter): BehaviorSubjectProxy<O> {
  return (new Proxy(stubFn, {
    get(_, p) {
      // Disabled feature ATM
      // // allow direct access to values on state
      // if (Symbol.toPrimitive == p) {
      //   return function toPrimitive(hint) {
      //     // Q: should we call toPrimitive on result?
      //     return getter(ps);
      //   }
      // }

      if ('value' == p) {
        return getter(ps);
      }

      if ('getValue' == p){
        return () => getter(ps);
      }

      // Observer/Subject-like pushing to stream
      // TODO: cover error / complete on root
      if ('next' == p) {
        return function next(value) {
          return setter(ps, value);
        };
      }

      if (OBSERVABLE_INSTANCE_PROP_KEYS.includes(p as any)) {
        const newS = s.pipe(bluck(ps), distinctUntilChanged());

        if (p == 'pipe') {
          return function () {
            // applying only gettable proxy
            return getSetProxy(newS.pipe.apply(newS, arguments), [], getter, () => {});
          };
        }

        return newS[p];
      }

      return getSetProxy(s, ps.concat(p), getter, setter);
    },
    set(_, p, value) {
      setter(ps.concat(p), value);
      return true;
    },
  }) as unknown) as BehaviorSubjectProxy<O>;
}

// bluck is similar to pluck
function bluck<T>(ps: Key[]) {
  return (observable: Observable<T>) => {
    if (!ps.length) {
      return observable;
    }

    return observable.pipe(pluck(...(ps as any[])));
  };
}

// poor man's getter and setter
type Getter = (ps: Path) => any;
function deepGetter<T>(getRoot: () => T): Getter {
  return (ps: Path) => {
    return ps.reduce((a, c) => (a ?? {})[c], getRoot());
  };
}

// TODO: cover arrays, nulls and other non-object values
type Setter = (ps: Path, value: any) => void;
function deepSetter<T>(getRoot: () => T, setRoot: (s: T) => void): Setter {
  return (ps: Path, v: any) => {
    if (ps.length == 0) {
      setRoot(v);
      return;
    }

    const s = getRoot();
    let pps = ps.slice(0, ps.length - 1);
    let p = ps[ps.length - 1];
    const ns = { ...s };
    const np = pps.reduce((a, c) => {
      return (a[c] = { ...a[c] });
    }, ns);

    np[p] = v;
    setRoot(ns);
  };
}

type Key = string | number | symbol;
type Path = Key[];
