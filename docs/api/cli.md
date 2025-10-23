# @ack/cli API Reference

This document provides a detailed API reference for the `@ack/cli` package.

## `createProject`

Creates a new ACK project from a template.

### Parameters

- `projectName`: The name of the project to create.
- `template`: The name of the template to use.

### Templates

- `blank`: A blank project with a minimal setup.
- `counter`: A simple counter application.
- `todo`: A to-do list application.

### Returns

A promise that resolves when the project is created.
