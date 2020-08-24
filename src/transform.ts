import CJSImportProcessor from "sucrase/dist/CJSImportProcessor";
import { HelperManager } from "sucrase/dist/HelperManager";
import identifyShadowedGlobals from "sucrase/dist/identifyShadowedGlobals";
import NameManager from "sucrase/dist/NameManager";
import { Options } from "sucrase/dist/Options";
import { parse } from "sucrase/dist/parser/index";
import TokenProcessor from "sucrase/dist/TokenProcessor";
import RootTransformer from "sucrase/dist/transformers/RootTransformer";

interface NamedImport {
  importedName: string;
  localName: string;
}

export interface ImportInfo {
  defaultNames: Array<string>;
  wildcardNames: Array<string>;
  namedImports: Array<NamedImport>;
  namedExports: Array<NamedImport>;
  hasBareImport: boolean;
  exportStarNames: Array<string>;
  hasStarExport: boolean;
}

function getSucraseContext(code: string, options: Options) {
  const file = parse(code, true, false, false);
  const tokens = file.tokens;
  const scopes = file.scopes;

  const nameManager = new NameManager(code, tokens);
  const helperManager = new HelperManager(nameManager);
  const tokenProcessor = new TokenProcessor(code, tokens, false, helperManager);
  let importProcessor = new CJSImportProcessor(
    nameManager,
    tokenProcessor,
    false,
    options,
    false,
    helperManager
  );
  importProcessor.preprocessTokens();
  identifyShadowedGlobals(
    tokenProcessor,
    scopes,
    importProcessor.getGlobalNames()
  );

  tokens;

  return {
    tokenProcessor,
    scopes,
    nameManager,
    importProcessor,
    helperManager,
  };
}

function transform(code: string, options: Options) {
  try {
    const sucraseContext = getSucraseContext(code, options);
    const transformer = new RootTransformer(
      sucraseContext,
      options.transforms,
      Boolean(options.enableLegacyBabel5ModuleInterop),
      options
    );

    let result = { code: transformer.transform() };
    if (options.sourceMapOptions) {
      if (!options.filePath) {
        throw new Error(
          "filePath must be specified when generating a source map."
        );
      }
    }
    const importInfoByPath = (sucraseContext.importProcessor as any)
      .importInfoByPath as Map<string, ImportInfo>;

    return {
      type: "success" as const,
      code: result.code,
      importInfoByPath,
      tokens: sucraseContext.tokenProcessor.tokens,
    };
  } catch (e) {
    //console.error(e);
    return {
      type: "error" as const,
      error: e,
      tokens: [] as const,
    };
  }
}

export function transformJsx(
  code: string,
  jsxPragma?: string,
  jsxFragmentPragma?: string
) {
  return transform(code, {
    transforms: ["jsx", "imports"],
    jsxFragmentPragma,
    jsxPragma,
    filePath: "index.jsx",
  });
}
