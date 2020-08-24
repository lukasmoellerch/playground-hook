import test from "ava";
import { codeToModule, transformJsx } from "../dist/index.cjs";

test("Can create a simple module", (t) => {
  const { code } = transformJsx(`
    export const a = 42;
  `);
  const module = codeToModule(code);
  const e = {};
  // @ts-ignore
  module(e, () => ({}));
  t.is(e.a, 42);
});

test("Can export default", (t) => {
  const { code } = transformJsx(`
    const a = 42;
    export default a;
  `);
  const module = codeToModule(code);
  const e = {};
  // @ts-ignore
  module(e, () => ({}));
  t.is(e.default, 42);
});

test("Can reexport everything form another module", (t) => {
  const { code } = transformJsx(`
    export * from "something";
  `);
  const module = codeToModule(code);
  const e = {};
  // @ts-ignore
  module(e, () => ({
    something: 42.1,
  }));
  t.is(e.something, 42.1);
});

test("filename and dirname work when they were provided", (t) => {
  const { code } = transformJsx(`
  export const f = __filename;
  export const d = __dirname;
`);
  const module = codeToModule(code, "/Users/mjr", "/Users/mjr/example.js");
  const e = {};
  // @ts-ignore
  module(e, () => ({}));
  t.is(e.f, "/Users/mjr/example.js");
  t.is(e.d, "/Users/mjr");
});
