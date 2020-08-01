import { act, renderHook } from "@testing-library/react-hooks";
import test from "ava";
import React from "react";
import { lazyModule, usePlayground } from "../dist/index.cjs";

test.serial("It renders the argument passed to render()", async (t) => {
  const { result } = renderHook(() =>
    usePlayground({
      "index.js": `
        import { render } from "sandbox";
        render(42);
      `,
    })
  );
  const { run } = result.current;
  await act(() => {
    const [promise] = run();
    return promise;
  });
  const { error, node } = result.current;
  t.falsy(error);
  t.is(node.props.children, 42);
});

test.serial("It can render simple React elements", async (t) => {
  const { result } = renderHook(() =>
    usePlayground(
      {
        "index.js": `
        import React from "react";
        import { render } from "sandbox";
        render(<div>Hello World!</div>);
      `,
      },
      "index.js",
      {
        react: lazyModule(React),
      }
    )
  );
  const { run } = result.current;
  await act(() => {
    const [promise] = run();
    return promise;
  });
  const { error, node } = result.current;
  t.falsy(error);
  t.deepEqual(node.props.children, <div>Hello World!</div>);
});

test.serial("It can render custom components", async (t) => {
  const Component = (_props) => <div>Hello!</div>;
  const { result } = renderHook(() =>
    usePlayground(
      {
        "index.js": `
        import React from "react";
        import { Component } from "lib";
        import { render } from "sandbox";
        render(<Component num={42}/>);
      `,
      },
      "index.js",
      {
        react: lazyModule(React),
        lib: lazyModule({ Component }),
      }
    )
  );
  const { run } = result.current;
  await act(() => {
    const [promise] = run();
    return promise;
  });
  const { error, node } = result.current;
  t.falsy(error);
  t.deepEqual(node.props.children, <Component num={42} />);
});

test.serial("It renders its output inside an error boundary", async (t) => {
  const { result } = renderHook(() =>
    usePlayground({
      "index.js": `
        import { render } from "sandbox";
        render(42);
      `,
    })
  );
  const { run } = result.current;
  await act(() => {
    const [promise] = run();
    return promise;
  });
  const { error, node } = result.current;
  t.falsy(error);
  t.true(node.type instanceof Function);
  t.truthy(node.props.onError);
  t.true(node.props.onError instanceof Function);
});

test.serial(
  "It doesn't throw when the syntax of a file is invalid",
  async (t) => {
    const { result } = renderHook(() =>
      usePlayground({
        "index.js": `
        import { render } from "sandbox";
        // I stopped while writing some JSX code
        render(<test);
      `,
      })
    );
    const { run } = result.current;
    await act(() => {
      const [promise] = run();
      return promise;
    });
    const { error, node } = result.current;
    t.truthy(error);
    t.truthy(error.loc);
    t.is(error.loc.column, 7);
    t.is(error.loc.line, 5);
    t.is(error.pos, 121);
    t.is(error.message, "Unexpectedly reached the end of input. (5:7)");

    t.falsy(node);
  }
);
