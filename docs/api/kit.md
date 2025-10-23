# @ack/kit API Reference

This document provides a detailed API reference for the `@ack/kit` package.

## `startDevServer`

Starts a Vite-based development server for an ACK application.

### Parameters

- `options`: An object of options for the development server.

### Options

- `root`: The root directory of the application.
- `port`: The port to run the server on.
- `host`: The host to run the server on.
- `open`: Whether to open the browser automatically.
- `https`: Whether to use HTTPS.

### Returns

A promise that resolves with the Vite dev server instance.

## `buildApp`

Builds an ACK application for production.

### Parameters

- `options`: An object of options for the build.

### Options

- `root`: The root directory of the application.
- `outDir`: The output directory for the build.
- `minify`: Whether to minify the output.
- `sourceMap`: Whether to generate a source map.

### Returns

A promise that resolves when the build is complete.
