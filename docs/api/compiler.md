# @ack/compiler API Reference

This document provides a detailed API reference for the `@ack/compiler` package.

## `compile`

The `compile` function is the main entry point for the compiler. It takes a string of `.ack` source code and returns a `CompileResult` object.

### Parameters

- `source`: The `.ack` source code to compile.
- `options`: An object of options for the compiler.

### Options

- `filePath`: The path to the `.ack` file.
- `format`: The output format for the compiled code. Can be `'esm'`, `'cjs'`, or `'both'`.
- `minify`: Whether to minify the compiled code.
- `sourceMap`: Whether to generate a source map.
- `ssr`: Whether to generate code for server-side rendering.

### Returns

A `CompileResult` object with the following properties:

- `code`: The compiled JavaScript code.
- `map`: The source map, if generated.
- `errors`: An array of errors that occurred during compilation.
- `warnings`: An array of warnings that occurred during compilation.
