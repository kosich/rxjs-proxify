import { Subject } from "rxjs";
import { coreProxy } from "./core/proxy";
import { Path, SubjectProxy } from "./core/types";

export function subject<O>(source$: Subject<O>): SubjectProxy<O> {
  // overrides work only for root values
  const getOverrides = {
    next: (ps: Path) => ps.length ? void 0 : v => source$.next(v),
    error: (ps: Path) => ps.length ? void 0 : e => source$.error(e),
    complete: (ps: Path) => ps.length ? void 0 : () => source$.complete(),
  }

  return coreProxy(source$, [], getOverrides) as SubjectProxy<O>;
}
