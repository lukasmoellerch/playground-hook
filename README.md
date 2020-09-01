<h1 align="center">
  playground-hook
  <br>
</h1>
<p align="center" style="font-size: 1.2rem;">
 A simple hook that allows you to include JavaScript playgrounds in your React app. 
</p>
<p align="center" style="font-size: 1.2rem;">
  <img src="https://img.shields.io/npm/v/playground-hook">
  <img src="https://img.shields.io/bundlephobia/minzip/playground-hook">
  <img src="https://img.shields.io/bundlephobia/min/playground-hook">
</p>

- Supports mutliple files
- Transpiles the source code using scurase
- Dynamically loads modules when they are needed
- The UI is up to you

## Example

codesandbox: https://codesandbox.io/s/boring-mendeleev-tcpdv

```tsx
const [entry, setEntry] = useState(code);
const { node, error, run } = usePlayground(
  {
    entry: entry
  },
  "entry",
  {
    react: lazyModule(React)
  }
);
return (
  <div className="App">
    <div>
      <textarea value={entry} onChange={(e) => setEntry(e.target.value)} />
    </div>
    <button onClick={run}>Run</button>
    {node}
  </div>
);
```

## Usage

The primary export of this package is a hook named `usePlayground` with the following signature:

```tsx
function usePlayground(
  codeModules: Record<string, string>,
  entry?: string,
  modules?: Record<string, [(neededExports: string[] | true) => Promise<Record<string, unknown>>, () => Record<string, unknown> | undefined]>
): {
  error: Error | undefined;
  node: React.ReactNode;
  run: () => readonly [Promise<void>, React.MutableRefObject<...>] | readonly [...];
  promise: React.MutableRefObject<...>;
  cancel: React.MutableRefObject<...>;
}
```

`codeModules` is a mapping that specifies the "files" that should be available in the execution context and which should be transpiled internally. When you call `run` the module named `entry` is executed. Using the `modules` parameter additional modules can be specified which are avalable as an object or a dynamic import. You can use it to inject modules into the sandbox. If you for example want your UI library available in the playground you have to specify it in modules. The signature of modules might look weird, but it is required to allow both the SSR usecase and to dynamically load the parts of the module which are required. This package also exports a utility function called `lazyModule` which returns an object that can be passed to modules as a value. You have to provide `lazyModule` with a synchronously loaded variant of your module and you can optionally probide a variant that is loaded asynchronously if it is required. This is usefull if you want some parts of your library available all the time but don't want the entire lbirary loaded when it is not needed.
