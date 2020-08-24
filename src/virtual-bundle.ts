export type ModuleFunction = (
  exports: Record<string, unknown>,
  require: (name: string) => unknown
) => void;
export type ModuleMap = Record<string, ModuleFunction>;
export function createVirtualBundle(modules: ModuleMap) {
  function start(entry: string) {
    const moduleCache: Record<string, unknown> = {};
    const require = (moduleName: string) => {
      if (moduleCache[moduleName]) {
        return moduleCache[moduleName];
      }
      const exports = {};
      moduleCache[moduleName] = exports;
      const module = modules[moduleName];
      if (typeof module !== "function")
        throw new Error(`Module "${moduleName}" not found`);
      module(exports, require);
      return moduleCache[moduleName];
    };

    require(entry);
  }

  return start;
}
