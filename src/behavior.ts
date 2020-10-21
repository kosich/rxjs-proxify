import { BehaviorSubject } from "rxjs";
import { coreProxy } from "./core/proxy";
import { BehaviorSubjectProxy, Path } from "./core/types";

export function behaviorSubject<O>(source$: BehaviorSubject<O>): BehaviorSubjectProxy<O> {
  const gett = () => source$.value;

  const setter = deepSetter(
    gett,
    ns => {
      source$.next(ns);
    }
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

// poor man's getter and setter
type Getter = (ps: Path) => any;
export function deepGetter<T>(getRoot: () => T): Getter {
  return (ps: Path) => {
    return ps.reduce((a, c) => (a ?? {})[c], getRoot());
  };
}

// TODO: cover arrays, nulls and other non-object values
type Setter = (ps: Path, value: any) => void;
export function deepSetter<T>(getRoot: () => T, setRoot: (s: T) => void): Setter {
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
