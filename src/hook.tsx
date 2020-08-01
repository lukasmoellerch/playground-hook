import React, { ErrorInfo, ReactElement, useRef, useState } from "react";
import { ErrorBoundary } from "./error-boundary";
import { executeMixed } from "./run";
import { ModuleFunction } from "./virtual-bundle";

export function usePlayground(
  codeModules: Record<string, string>,
  entry: string = "index.js",
  modules: Record<
    string,
    (neededExports: string[] | true) => Promise<Record<string, unknown>>
  > = {}
) {
  const [node, setNode] = useState<React.ReactNode>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const cancel = useRef<() => void | undefined>();
  const promise = useRef<Promise<void>>();

  const transpileCache = useRef<Record<string, [string, ModuleFunction]>>({});

  const onError = (error: Error, errorInfo: ErrorInfo) => {
    console.log({ error, errorInfo });
  };
  const render = (node: ReactElement) => {
    setNode(<ErrorBoundary onError={onError}>{node}</ErrorBoundary>);
  };

  const newNativeModules = {
    ...modules,
    sandbox: () =>
      Promise.resolve({
        render,
      }),
  };
  const run = () => {
    if (cancel.current) cancel.current();
    try {
      const [newPromise, newCancel] = executeMixed(
        newNativeModules,
        codeModules,
        entry,
        transpileCache.current,
        setError
      );
      promise.current = newPromise;
      cancel.current = newCancel;
      return [newPromise, cancel];
    } catch (e) {
      return [Promise.resolve(), () => {}];
    }
  };

  return { error, node, run, promise, cancel };
}
