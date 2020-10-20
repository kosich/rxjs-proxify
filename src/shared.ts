// keys to preserve for Observable to work
// these were manually picked from Observable type
// TODO: consider doing prototype chain check instead
export const OBSERVABLE_INSTANCE_PROP_KEYS = [
  '_isScalar',
  'source',
  'operator',
  'lift',
  'subscribe',
  '_trySubscribe',
  'forEach',
  '_subscribe',
  'pipe',
  'toPromise',
];

// a fn that will be used as Proxy basis
// so that we could use Proxy.apply override
// for a.b.c().subscribe(…) scenarios
export function stubFn() {}
