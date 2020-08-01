import test from "ava";
import { transformJsx } from "../dist/index.cjs";

test("`transform` can transform javascript", (t) => {
  const code = `const a = 42;`;
  const transformed = transformJsx(code);
  t.is(transformed.code, `"use strict";const a = 42;`);
});

test("`transform` can transform jsx", (t) => {
  const code = `const a = <a>hi</a>;`;
  const transformed = transformJsx(code);
  t.is(
    transformed.code,
    `"use strict";const _jsxFileName = "index.jsx";const a = React.createElement(\'a\', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 1}}, "hi");`
  );
});

test("`transform` can detect imports", (t) => {
  const code = `import a from "package";`;
  const transformed = transformJsx(code);
  t.is(
    transformed.code,
    `"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _package = require(\'package\'); var _package2 = _interopRequireDefault(_package);`
  );
  t.assert(transformed.importInfoByPath instanceof Map);
  t.assert(transformed.importInfoByPath.get("package"));
});

test("`transform` can detect bare imports", (t) => {
  const code = `import * as a from "package";`;
  const transformed = transformJsx(code);
  t.assert(transformed.importInfoByPath instanceof Map);
  t.assert(transformed.importInfoByPath.get("package").wildcardNames);
});
