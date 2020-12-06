export function lazyModule<T extends object, S extends keyof T>(
  syncLoaded: Pick<T, S>,
  asyncLoad?: () => Promise<T>
): [(neededExports: string[] | true) => Promise<T>, () => Pick<T, S>] {
  let promise: Promise<T> | undefined;
  return [
    async (neededExports: string[] | true) => {
      if (
        asyncLoad === undefined ||
        (Array.isArray(neededExports) &&
          neededExports.every((key) =>
            Object.prototype.hasOwnProperty.call(syncLoaded, key)
          ))
      ) {
        return syncLoaded as T;
      } else {
        if (promise) return promise;
        promise = asyncLoad();
        return await promise;
      }
    },
    () => syncLoaded,
  ];
}
