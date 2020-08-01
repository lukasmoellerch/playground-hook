import { codeToModule } from "./code-to-module";
import { transformJsx } from "./transform";
import { createVirtualBundle, ModuleFunction } from "./virtual-bundle";

export function executeMixed(
  modules: Record<
    string,
    (neededExports: string[] | true) => Promise<Record<string, unknown>>
  >,
  codeModules: Record<string, string>,
  entry: string,
  cached: Record<string, [string, ModuleFunction]>,
  setError: (e: any) => void
) {
  let cancelled = false;
  const promise = (async () => {
    let hasError = false;
    const moduleDependencies: Record<string, true | string[]> = {};
    const transpiledCodeModules = Object.fromEntries(
      Object.entries(codeModules).map(([name, newModuleCode]) => {
        if (cached[name] !== undefined && cached[name][0] === newModuleCode) {
          return cached[name];
        } else {
          const result = transformJsx(newModuleCode);
          if (result.type === "error") {
            setError(result.error);
            hasError = true;
          }
          const code = result.code || "";
          if (result.importInfoByPath) {
            for (let [key, value] of result.importInfoByPath.entries()) {
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
          const mod = codeToModule(code);
          cached[name] = [newModuleCode, mod];
          return [name, mod];
        }
      })
    );
    if (hasError) return;

    const promises: Promise<void>[] = [];
    const nativeModules: Record<string, ModuleFunction> = {};
    for (let [depName, depType] of Object.entries(moduleDependencies)) {
      promises.push(
        new Promise((resolve, reject) => {
          modules[depName](depType)
            .then((mod: Record<string, unknown>) => {
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
    if (cancelled) return;
    const playgroundModules = {
      ...transpiledCodeModules,
      ...nativeModules,
    };

    const execute = createVirtualBundle(playgroundModules);
    try {
      execute(entry);
    } catch (e) {
      console.error("hi");
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
    (neededExports: string[] | true) => Promise<Record<string, unknown>>
  >,
  codeModules: Record<string, string>,
  entry: string,
  cached: Record<string, [string, ModuleFunction]>,
  setError: (e: any) => void
) {
  const [promise] = executeMixed(modules, codeModules, entry, cached, setError);
  await promise;
}
