// @ts-nocheck
import test from "ava";
import { executeMixedPromise, lazyModule } from "../dist/index.cjs";

test("Can run a simple module without failing", async (t) => {
  await executeMixedPromise(
    {},
    {
      "index.js": ";",
    },
    "index.js",
    {},
    (e) => {
      t.fail(e.toString());
    }
  );

  t.pass();
});

test("Can run a simple module with a native dependency", async (t) => {
  await executeMixedPromise(
    {
      sandbox: lazyModule({
        pass: () => t.pass(),
      }),
    },
    {
      "index.js": `
        import { pass } from "sandbox";
        pass();
      `,
    },
    "index.js",
    {},
    (e) => {
      t.fail(e.toString());
    }
  );
});

test("Loads lazy modules if necessary", async (t) => {
  await executeMixedPromise(
    {
      sandbox: lazyModule(
        {
          pass: () => t.fail(),
        },
        () =>
          Promise.resolve({
            pass: () => {},
            pass2: () => t.pass(),
          })
      ),
    },
    {
      "index.js": `
        import { pass, pass2 } from "sandbox";
        pass();
        pass2();
      `,
    },
    "index.js",
    {},
    (e) => {
      t.fail(e.toString());
    }
  );
});

test("Doesn't load lazy modules if it's not necessary", async (t) => {
  await executeMixedPromise(
    {
      sandbox: lazyModule(
        {
          pass: () => t.pass(),
        },
        () =>
          Promise.resolve({
            pass: () => {},
          })
      ),
    },
    {
      "index.js": `
        import { pass } from "sandbox";
        pass();
      `,
    },
    "index.js",
    {},
    (e) => {
      t.fail(e.toString());
    }
  );
});
