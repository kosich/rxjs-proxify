<div align="center">
  <h1>
    <br/>
    { 👓 }
    <br/>
    <sub><sub>Turn a Stream of Objects into an Object of Streams</sub></sub>
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

Access values inside RxJS Observables as if they were directly available on the stream!

```ts
stream.pipe(pluck('msg')).subscribe(…);
// turn ↑ into ↓
stream.msg.subscribe(…);
```

With good TypeScript support! 😲

Roughly speaking, Proxify turns  
`Observable<{ title: string }>` into `Observable<{ title: string }> & { title: Observable<string> }`  
And it does it recursively. Letting you access Observable API as well as pluck props & methods from any depth of the stream!

## 📦 Install

```
npm i rxjs-proxify
```

or [try it online](https://stackblitz.com/edit/rxjs-proxify-repl?file=index.ts)!

## 🛠 API

There are two methods available to you: [`proxify`](#proxify) and [`statify`](#statify)

## Proxify

`proxify(stream)` will wrap your Observable, Subject or BehaviorSubject in a Proxy:

**Observable Proxy**  
subscribe at any depth

```ts
const observable = proxify( of({ p: '🐑' }) );
observable.subscribe(console.log); // > { p: 🐑 }
observable.p.subscribe(console.log); // > 🐑
```

**Subject Proxy**  
subscribe at any depth, push at the root

```ts
const subject = proxify(new Subject<{ p: string }>());
subject.subscribe(console.log);
subject.p.subscribe(console.log);
subject.next({ p: '🐥' }); // > { p: 🐥 } // > 🐥
```

**BehaviorSubject Proxy**  
subscribe at any depth, push at any depth, synchronously read the current state

```ts
const behavior = proxify(new BehaviorSubject({ p: '🐖' }));
behavior.p.subscribe(console.log); // > 🐖
behavior.p.next('🐇'); // > 🐇
console.log(behavior.p.value) // > 🐇
```

### Statify

`statify(value)` will put the value in a BehaviorSubject Proxy and add a `distinctUntilChanged` operator on each property access.

**State Proxy**
subscribe to distinct updates at any depth, push at any depth, synchronously read the current state

```ts
// create a state
const state = statify({ a: '🐰', z: '🏡' });

// listen to & log root state changes
state.subscribe(console.log); //> { a:🐰 z:🏡 }

// update particular substate
state.a.next('🐇'); //> { a:🐇 z:🏡 }

// read current values
console.log(state.z.value + state.a.value); //> 🏡🐇

// update root state, still logging
state.next({ a: '🐇', z: '☁️' }) //> { a:🐇 z:☁️ }

// and then…
state.z.next('🌙');   //> { a:🐇  z:🌙 }
state.a.next('🐇👀'); //> { a:🐇👀 z:🌙 }
state.z.next('🛸')    //> { a:🐇👀 z:🛸 }
state.a.next('💨');   //> { a:💨  z:🛸 }
```

See Examples section for more details.

## 📖 Examples

### Basic

```ts
import { proxify } from "rxjs-proxify";
import { of } from "rxjs";

const o = of({ msg: 'Hello' }, { msg: 'World' });
const p = proxify(o);
p.msg.subscribe(console.log);

// equivalent to
// o.pipe(pluck('msg')).subscribe(console.log);
```

### With JS destructuring

Convenient stream props splitting

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

**⚠️ WARNING:** as shown in "equivalent" comment, this operation creates several Observables from the source Observable. Which means that if your source is _cold_ — then you might get undesired subscriptions. This is a well-known nuance of working with Observables. To avoid this, you can use a multicasting operator on source before applying `proxify`, e.g. with [`shareReplay`](https://rxjs.dev/api/operators/shareReplay):

```ts
const { msg, status } = proxify(o.pipe(shareReplay(1)));
```

### With pipe

Concatenate all messages using `pipe` with `scan` operator:

```ts
import { proxify } from "rxjs-proxify";
import { of } from "rxjs";
import { scan } from "rxjs/operators";

const o = of({ msg: 'Hello' }, { msg: 'World' });
const p = proxify(o);
p.msg.pipe(scan((a,c)=> a + c)).subscribe(console.log);

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

## 🤝 Want to contribute to this project?

That will be awesome!

Please create an issue before submiting a PR — we'll be able to discuss it first!

Thanks!

## Enjoy 🙂
