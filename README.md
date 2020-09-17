<div align="center">
  <h1>
    <br/>
    👓
    <br/>
    <sub><sub>A recursive Proxy to access values on a Stream</sub></sub>
    <br/>
    <br/>
    <a href="https://www.npmjs.com/package/rxjs-proxify"><img src="https://img.shields.io/npm/v/rxjs-proxify" alt="NPM"></a>
    <a href="https://bundlephobia.com/result?p=rxjs-proxify@latest"><img src="https://img.shields.io/bundlephobia/minzip/rxjs-proxify?label=gzipped" alt="Bundlephobia"></a>
    <a href="https://opensource.org/licenses/MIT" rel="nofollow"><img src="https://img.shields.io/npm/l/rxjs-proxify" alt="MIT license"></a>
    <br/>
    <br/>
    <br/>
  </h1>
</div>

Access values inside RxJS Observables as if they were directly available on the stream, with good TypeScript support!

```ts
// turn a
stream.pipe(pluck('msg')).subscribe(…);
// into
stream.msg.subscribe(…);
```

😲 !

Roughly speaking, Proxify turns your `Observable<O>` into `Observable<O> & O<Observable<O[keyof O]>>`, recursively. Letting you access Observable API as well as pluck props / methods from the stream!

## 📖 Examples

### Basic usage

`pluck` a single property:

```ts
import { proxify } from "rxjs-proxify";
import { of } from "rxjs";

const o = of({ msg: 'Hello' }, { msg: 'World' });
const p = proxify(o);
o.msg.subscribe(console.log);

// equivalent to
// o.pipe(pluck('msg')).subscribe(console.log);
```

### With JS Destructuring

```ts
import { proxify } from "rxjs-proxify";
import { of } from "rxjs";

const o = of({ msg: 'Hello', status: 'ok'  }, { msg: 'World', status: 'ok' });
const { msg, status } = proxify(o);
msg.subscribe(console.log);
status.subscribe(console.log);

// equivalent to
// const msg = o.pipe(pluck('msg'));
// const status = o.pipe(pluck('status'));
// msg.subscribe(console.log);
// status.subscribe(console.log);
```

### With pipe

Concatenate all messages using `pipe` with `scan` operator:

```ts
import { proxify } from "rxjs-proxify";
import { of } from "rxjs";
import { scan } from "rxjs/operators";

const o = of({ msg: 'Hello' }, { msg: 'World' });
const p = proxify(o);
o.msg.pipe(scan((a,c)=> a + c)).subscribe(console.log);

// equivalent to
// o.pipe(pluck('msg'), scan((a,c)=> a + c)).subscribe(console.log);
```

### Calling methods

Pick a method and call it:

```ts
import { proxify } from "rxjs-proxify";
import { of } from "rxjs";

const o = of({ msg: () => 'Hello' }, { msg: () => 'World' });
const p = proxify(o);
p.msg().subscribe(console.log);

// equivalent to
// o.pipe(map(x => x?.map())).subscribe(console.log);
```

### Accessing array values

Proxify is recursive, so you can keep chaining props or indices

```ts
import { proxify } from "rxjs-proxify";
import { of } from "rxjs";

const o = of({ msg: () => ['Hello'] }, { msg: () => ['World'] });
const p = proxify(o);
p.msg()[0].subscribe(console.log);

// equivalent to
// o.pipe(map(x => x?.map()), pluck(0)).subscribe(console.log);
```

## 🤝 Want to collaborate on this package?

I'll be happy to see your contribution! Please create an issue before submiting a PR — we'll be able to discuss it first!

## Enjoy 🙂
