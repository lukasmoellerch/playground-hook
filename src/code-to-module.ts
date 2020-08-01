import { ModuleFunction } from "./virtual-bundle";

export function codeToModule(
  code: string,
  dirname?: string,
  filename?: string
): ModuleFunction {
  let src = "this.constructor.constructor = function () {};\n";
  if (filename) src += `const __filename = ${JSON.stringify(filename)}\n`;
  if (filename) src += `const __dirname = ${JSON.stringify(dirname)}\n`;
  src += code + "\n";
  const fn = Function("exports, require", src);
  return fn as ModuleFunction;
}
