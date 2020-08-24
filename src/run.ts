import { codeToModule } from "./code-to-module";
import { ImportInfo, transformJsx } from "./transform";
import { createVirtualBundle, ModuleFunction } from "./virtual-bundle";

function transpileWithCache(
  codeModules: Record<string, string>,
  cached: Record<string, [string, ModuleFunction, Map<string, ImportInfo>]>,
  moduleDependencies: Record<string, true | string[]>
) {
  function handleImports(importInfoByPath: Map<string, ImportInfo>) {
    for (let [key, value] of importInfoByPath.entries()) {
      const hasWildcard = value.wildcardNames.length;
      if (moduleDependencies[key] === undefined) {
        moduleDependencies[key] = hasWildcard
          ? true
          : value.namedImports.map((a) => a.importedName);
      } else {
        const deps = moduleDependencies[key];
        if (deps === true) continue;
        if (hasWildcard) {
          moduleDependencies[key] = true;
        } else {
          deps.push(...value.namedImports.map((a) => a.importedName));
        }
      }
    }
  }
  const res = Object.fromEntries(
    Object.entries(codeModules).map(([name, newModuleCode]) => {
      if (cached[name] !== undefined && cached[name][0] === newModuleCode) {
        handleImports(cached[name][2]);
        return [name, cached[name][1]];
      } else {
        const result = transformJsx(newModuleCode);
        if (result.type === "error") {
          throw result.error;
        }
        const code = result.code || "";
        if (result.importInfoByPath) {
          handleImports(result.importInfoByPath);
        }
        const mod = codeToModule(code);
        cached[name] = [newModuleCode, mod, result.importInfoByPath];
        return [name, mod];
      }
    })
  );

  return res;
}

export function trySync(
  modules: Record<
    string,
    [
      (neededExports: string[] | true) => Promise<Record<string, unknown>>,
      () => Record<string, unknown> | undefined
    ]
  >,
  codeModules: Record<string, string>,
  entry: string,
  cached: Record<string, [string, ModuleFunction, Map<string, ImportInfo>]>
) {
  const moduleDependencies: Record<string, true | string[]> = {};
  const transpiledCodeModules = transpileWithCache(
    codeModules,
    cached,
    moduleDependencies
  );

  const nativeModules: Record<string, ModuleFunction> = {};
  for (let [depName] of Object.entries(moduleDependencies)) {
    const mod = modules[depName][1]();
    if (mod === undefined) continue;

    nativeModules[depName] = (e) => {
      for (let [key, value] of Object.entries(mod as {})) {
        e[key] = value;
      }
    };
  }
  const playgroundModules = {
    ...transpiledCodeModules,
    ...nativeModules,
  };

  const execute = createVirtualBundle(playgroundModules);

  execute(entry);
}

function safeTranspileWithCache(
  codeModules: Record<string, string>,
  cached: Record<string, [string, ModuleFunction, Map<string, ImportInfo>]>,
  moduleDependencies: Record<string, true | string[]>,
  setError: (e: Error) => void
) {
  try {
    return transpileWithCache(codeModules, cached, moduleDependencies);
  } catch (error) {
    setError(error);
    return {};
  }
}
export function executeMixed(
  modules: Record<
    string,
    [
      (neededExports: string[] | true) => Promise<Record<string, unknown>>,
      () => Record<string, unknown> | undefined
    ]
  >,
  codeModules: Record<string, string>,
  entry: string,
  cached: Record<string, [string, ModuleFunction, Map<string, ImportInfo>]>,
  setError: (e: any) => void
) {
  let cancelled = false;
  const promise = (async () => {
    let hasError = false;
    const moduleDependencies: Record<string, true | string[]> = {};
    const transpiledCodeModules = safeTranspileWithCache(
      codeModules,
      cached,
      moduleDependencies,
      (e) => {
        hasError = true;
        setError(e);
      }
    );
    if (hasError) return;

    const promises: Promise<void>[] = [];
    const nativeModules: Record<string, ModuleFunction> = {};
    for (let [depName, depType] of Object.entries(moduleDependencies)) {
      promises.push(
        new Promise((resolve, reject) => {
          const m = modules[depName];
          if (m === undefined) {
            hasError = true;
            setError(new Error(`Module not found: ${depName}`));
            return resolve();
          }
          m[0](depType)
            .then((mod) => {
              nativeModules[depName] = (e) => {
                for (let [key, value] of Object.entries(mod)) {
                  e[key] = value;
                }
              };
              resolve();
            })
            .catch(reject);
        })
      );
    }
    await Promise.all(promises);
    if (hasError) return;
    if (cancelled) return;
    const playgroundModules = {
      ...transpiledCodeModules,
      ...nativeModules,
    };

    const execute = createVirtualBundle(playgroundModules);
    try {
      execute(entry);
    } catch (e) {
      setError(e);
    }
  })();
  const cancel = () => {
    cancelled = true;
  };
  return [promise, cancel] as const;
}

export async function executeMixedPromise(
  modules: Record<
    string,
    [
      (neededExports: string[] | true) => Promise<Record<string, unknown>>,
      () => Record<string, unknown> | undefined
    ]
  >,
  codeModules: Record<string, string>,
  entry: string,
  cached: Record<string, [string, ModuleFunction, Map<string, ImportInfo>]>,
  setError: (e: any) => void
) {
  const [promise] = executeMixed(modules, codeModules, entry, cached, setError);
  await promise;
}
