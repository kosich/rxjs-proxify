import { Subject } from "rxjs";
import { coreProxy } from "./core/proxy";
import { Key, Path, SubjectProxy } from "./core/types";

export function subject<O>(source$: Subject<O>): SubjectProxy<O> {
  // overrides work only for root values
  const overrides = {
    next: () => v => source$.next(v),
    error: () => e => source$.error(e),
    complete: () => () => source$.complete(),
  };

  const getOverride = (ps: Path, p: Key) => {
    if (ps.length) {
      return void 0;
    }

    return overrides[p];
  }

  return coreProxy(source$, [], getOverride) as SubjectProxy<O>;
}
