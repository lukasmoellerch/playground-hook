export function lazyModule<T extends object, S extends keyof T>(
  syncLoaded: Extract<T, S>,
  asyncLoad?: () => Promise<T>
) {
  let promise: Promise<T> | undefined;
  return async (neededExports: string[] | true) => {
    if (
      asyncLoad === undefined ||
      (Array.isArray(neededExports) &&
        neededExports.every((key) =>
          Object.prototype.hasOwnProperty.call(syncLoaded, key)
        ))
    ) {
      return syncLoaded;
    } else {
      if (promise) return promise;
      promise = asyncLoad();
      return await promise;
    }
  };
}
