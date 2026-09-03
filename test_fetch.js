Object.defineProperty(globalThis, 'fetch', { get: () => function fetch(){ return 'orig'; }, configurable: true });
Object.defineProperty(globalThis, 'fetch', { value: function myFetch(){ return 'new'; }, writable: true, configurable: true });
console.log(globalThis.fetch());
