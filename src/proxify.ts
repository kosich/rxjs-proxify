import { BehaviorSubject, isObservable, Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";
import { noop, OBSERVABLE_INSTANCE_PROP_KEYS } from "./shared";
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
  return coreProxy(source$, []) as ObservableProxy<O>;
}

function subject<O>(source$: Observable<O>): SubjectProxy<O> {
  return coreProxy(source$, []) as SubjectProxy<O>;
}

function behaviorSubject<O>(source$: BehaviorSubject<O>): BehaviorSubjectProxy<O> {
  const gett = () => source$.value;

  const setter = deepSetter(
    gett,
    ns => {
      source$.next(ns);
    },
  );

  const getOverrides = {
    value: deepGetter(gett),
    getValue: (ps: Path) => () => deepGetter(gett)(ps),
    next: (ps: Path) => function next(value) {
      return setter(ps, value);
    },
    error: () => e => source$.error(e),
    complete: () => () => source$.complete()
  };

  return coreProxy(source$, [], getOverrides) as BehaviorSubjectProxy<O>;
}

// core api proxy
export function coreProxy<O>(o: Observable<O>, ps: Path, getOverrides?: any): ObservableProxy<O> {
  // we need to preserve property proxies, so that
  // ```ts
  // let o = of({ a: 42 });
  // let p = proxify(o);
  // assert(p.a === p.a);
  // ```
  const proxyForPropertyCache = new Map<keyof O, ObservableProxy<O[keyof O]>>();

  return (new Proxy(noop, {
    // call result = O.fn in Observable<O>
    // and make it Observable<result>
    apply(_, __, argumentsList) {
      return coreProxy(
        o.pipe(
          map(f => {
            // TODO: properly type it
            if (typeof f == 'function') {
              const result = Reflect.apply(f, void 0, argumentsList);
              return result;
            }

            // non-function or null values are skipped
            return null;
          }),
        ),
        []
      );
    },

    // get Observable<O.prop> from Observable<O>
    get(_, p: keyof O & keyof Observable<O>, receiver) {
      if (getOverrides && p in getOverrides) {
        return getOverrides[p](ps);
      }

      // shortcut for pipe
      if (p == 'pipe') {
        return function () {
          const pipe = Reflect.get(o, p, receiver);
          const r = Reflect.apply(pipe, o, arguments);
          return coreProxy(r, ps.concat(p));
        };
      }

      // pass through Observable methods/props
      if (OBSERVABLE_INSTANCE_PROP_KEYS.includes(p as any)) {
        const builtIn = Reflect.get(o, p, receiver);
        // NOTE: we're binding .pipe, .subscribe, .lift, etc to current Source,
        // so that inner calls to `this` wont go through proxy again. This is
        // not equal to raw Rx where these fns are not bound
        if (typeof builtIn == 'function') {
          return builtIn.bind(o);
        } else {
          return builtIn;
        }
      }

      if (proxyForPropertyCache.has(p)) {
        return proxyForPropertyCache.get(p);
      }

      // return proxified sub-property
      const subproxy = coreProxy(
        o.pipe(
          map(v => {
            if (v == null) {
              // similar to pluck, we skip nullish values
              return v;
            } else if (typeof v[p] == 'function') {
              // we should keep the context for methods
              return (v[p] as any).bind(v);
            } else {
              // pluck
              return v[p];
            }
          }),
        ) as Observable<O[typeof p]>,
        ps.concat(p),
        getOverrides,
      );

      // cache o.prop.subprop
      proxyForPropertyCache.set(p, subproxy);
      return subproxy;
    },
  }) as unknown) as ObservableProxy<O>;
}

type Key = string | number | symbol;
type Path = Key[];

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
