// @ts-nocheck
import test from "ava";
import { createVirtualBundle } from "../dist/index.cjs";

test("Can execute simple virtual bundles", (t) => {
  const execute = createVirtualBundle({
    "index.js": (e, r) => {
      const value = r("value.js");
      t.is(value.a, 12);
    },
    "value.js": (e, r) => {
      e.a = 12;
    },
  });

  execute("index.js");
});

// https://nodejs.org/api/modules.html#modules_cycles
test("Can handle circular imports", (t) => {
  const logLines = [];
  const log = (str) => logLines.push(str);
  const execute = createVirtualBundle({
    "main.js": (_e, r) => {
      log("main starting");
      const a = r("a.js");
      const b = r("b.js");
      log(`in main, a.done = ${a.done}, b.done = ${b.done}`);
    },
    "a.js": (e, r) => {
      log("a starting");
      e.done = false;
      const b = r("b.js");
      log(`in a, b.done = ${b.done}`);
      e.done = true;
      log("a done");
    },
    "b.js": (e, r) => {
      log("b starting");
      e.done = false;
      const a = r("a.js");
      log(`in b, a.done = ${a.done}`);
      e.done = true;
      log("b done");
    },
  });

  execute("main.js");

  t.deepEqual(logLines, [
    "main starting",
    "a starting",
    "b starting",
    "in b, a.done = false",
    "b done",
    "in a, b.done = true",
    "a done",
    "in main, a.done = true, b.done = true",
  ]);
});
