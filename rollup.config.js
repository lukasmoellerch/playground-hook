import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";

const baseReplaceConfig = {
  "export let isJSXEnabled;": "export const isJSXEnabled = true;",
  "isJSXEnabled = isJSXEnabledArg;": "",

  "export let isTypeScriptEnabled;": "export const isTypeScriptEnabled = true;",
  "isTypeScriptEnabled = isTypeScriptEnabledArg;": "",

  "export let isFlowEnabled;": "export const isFlowEnabled = false;",
  "isFlowEnabled = isFlowEnabledArg;": "",
  delimiters: ["", ""],
  include: ["node_modules/sucrase/dist/parser/traverser/base.mjs"],
};
const transformerReplaceConfig = {
  'transforms.includes("jsx")': "true",
  'transforms.includes("imports")': "true",

  'transforms.includes("react-hot-loader")': "false",
  'transforms.includes("flow")': "false",
  'transforms.includes("typescript")': "false",
  delimiters: ["", ""],
  include: ["node_modules/sucrase/dist/transformers/RootTransformer.mjs"],
};

export default [
  {
    external: ["react", "react-dom", "tslib"],
    input: "src/index.tsx",
    output: {
      dir: "./",
      name: "JSXPlayground",
      entryFileNames: pkg.browser,
      format: "umd",
      globals: {
        react: "React",
        "react-dom": "ReactDOM",
      },
    },
    plugins: [
      // @ts-ignore
      replace(baseReplaceConfig),
      // @ts-ignore
      replace(transformerReplaceConfig),
      resolve(),
      commonjs(),
      typescript({
        declaration: true,
        declarationDir: "dist/",
        rootDir: "src/",
      }),
      terser({}),
    ],
  },
  {
    external: ["react", "react-dom"],
    input: "src/index.tsx",

    plugins: [
      // @ts-ignore
      replace(baseReplaceConfig),
      // @ts-ignore
      replace(transformerReplaceConfig),
      typescript(),
      resolve(),
      commonjs(),
      // terser({}),
    ],
    output: [
      { file: pkg.main, format: "cjs" },
      { file: pkg.module, format: "es" },
    ],
  },
];
