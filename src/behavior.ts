import { BehaviorSubject } from 'rxjs';
import { coreProxy } from './core/proxy';
import { BehaviorSubjectProxy, Key, Path } from './core/types';

export function behaviorSubject<O>(source$: BehaviorSubject<O>, distinct?: boolean): BehaviorSubjectProxy<O> {
  const rootGetter = () => source$.value;

  const setter = deepSetter(rootGetter, ns => void source$.next(ns));

  const getOverride = (ps: Path, p: Key) => {
    const readValue = () => deepGetter(rootGetter)(ps);

    const overrides = {
      value: readValue,
      getValue: () => readValue,
      [Symbol.toPrimitive]: () => readValue,
      next: () => value => {
        if (!distinct || value !== readValue()) {
          setter(ps, value);
        }
      },
      error: () => e => source$.error(e),
      complete: () => () => source$.complete(),
    };

    return overrides[p];
  };

  return coreProxy(source$, [], getOverride, distinct) as BehaviorSubjectProxy<O>;
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
