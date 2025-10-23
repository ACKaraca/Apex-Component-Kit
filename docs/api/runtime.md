# @ack/runtime API Reference

This document provides a detailed API reference for the `@ack/runtime` package.

## `createReactive`

Creates a reactive object that can be used to track changes to its properties.

### Parameters

- `obj`: The object to make reactive.

### Returns

A reactive proxy of the original object.

## `watch`

Watches a reactive object for changes to its properties.

### Parameters

- `obj`: The reactive object to watch.
- `prop`: The name of the property to watch.
- `callback`: A callback function to call when the property changes.

### Returns

A function that can be called to stop watching the object.

## `mount`

Mounts a component to a DOM element.

### Parameters

- `component`: The component to mount.
- `target`: The DOM element to mount the component to.

### Returns

The root element of the mounted component.
