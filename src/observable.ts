import { Observable } from 'rxjs';
import { coreProxy } from './core/proxy';
import { ObservableProxy } from './core/types';

export function observable<O>(source$: Observable<O>): ObservableProxy<O> {
  return coreProxy(source$, []) as ObservableProxy<O>;
}
