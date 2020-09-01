import React, { ErrorInfo, ReactElement, useRef, useState } from "react";
import { ErrorBoundary } from "./error-boundary";
import { executeMixed, trySync } from "./run";
import { ImportInfo } from "./transform";
import { ModuleFunction } from "./virtual-bundle";

export function usePlayground(
  codeModules: Record<string, string>,
  entry: string = "index.js",
  modules: Record<
    string,
    [
      (neededExports: string[] | true) => Promise<Record<string, unknown>>,
      () => Record<string, unknown> | undefined
    ]
  > = {}
) {
  const [error, setError] = useState<Error | undefined>(undefined);
  const onError = (error: Error, _errorInfo: ErrorInfo) => {
    setError(error);
  };
  const render = (node: ReactElement) => {
    setNode(<ErrorBoundary onError={onError}>{node}</ErrorBoundary>);
  };
  const newNativeModules: Record<
    string,
    [
      (neededExports: string[] | true) => Promise<Record<string, unknown>>,
      () => Record<string, unknown> | undefined
    ]
  > = {
    ...modules,
    sandbox: [
      () =>
        Promise.resolve({
          render,
        }),
      () => ({ render }),
    ],
  };
  const transpileCache = useRef<
    Record<string, [string, ModuleFunction, Map<string, ImportInfo>]>
  >({});
  const [node, setNode] = useState<React.ReactNode>(() => {
    try {
      let n: React.ReactNode = null;
      const syncRender = (node: ReactElement) => {
        n = <ErrorBoundary onError={() => {}}>{node}</ErrorBoundary>;
      };
      const syncNativeModules: Record<
        string,
        [
          (neededExports: string[] | true) => Promise<Record<string, unknown>>,
          () => Record<string, unknown> | undefined
        ]
      > = {
        ...modules,
        sandbox: [
          () =>
            Promise.resolve({
              render: syncRender,
            }),
          () => ({ render: syncRender }),
        ],
      };
      trySync(syncNativeModules, codeModules, entry, transpileCache.current);

      return n;
    } catch (e) {
      return null;
    }
  });

  const cancel = useRef<() => void | undefined>();
  const promise = useRef<Promise<void>>();

  const run = () => {
    if (cancel.current) cancel.current();
    try {
      setError(undefined);
      const [newPromise, newCancel] = executeMixed(
        newNativeModules,
        codeModules,
        entry,
        transpileCache.current,
        setError
      );
      promise.current = newPromise;
      cancel.current = newCancel;
      return [newPromise, cancel] as const;
    } catch (e) {
      return [Promise.resolve(), () => {}] as const;
    }
  };

  return { error, node, run, promise, cancel };
}
