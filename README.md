
# Small vinyl-stream wrapper -aka Gulp plugin- for eslint

Run eslint within your streams. Supports automatic fixing of files. Also has a fast method for more speed, and a slow method for more control.

> *NOTE:* No tests have been written yet!

## Installation

`yarn install`. Or `npm install`. Or just copy the files to your own project.

## Usage

```
const eslintWrapper = require('@eklingen/vinyl-stream-eslint')
stream.pipe(eslintWrapper())
```

## Options

There are a few options you can play with:

### `eslint`

Configuration options for eslint.

```
eslintWrapper({
  eslint: {
    allowInlineConfig: true,
    cache: true,
    cacheLocation: './node_modules/.eslintcache',
    cwd: process.cwd(),
    fix: true,
    fixTypes: ['problem', 'suggestion', 'layout'],
    ignore: true,
    reportUnusedDisableDirectives: false,
    globInputPaths: true
  }
})
```

### `config`

You can pass a configuration object, a string to the configuration file or leave it out. When you leave it out, eslint will try to find the configuration file by itself. This is usually the best option.

```
eslintWrapper({
  config: { ... }
})
```

```
eslintWrapper({
  config: '../.eslintrc.js'
})
```

### `failOnError`

This will determine wether to fail or not. Useful in a pre-commit hook, for example.

## Fast method vs Slow method

This plugin offers two different methods of running eslint.

### Fast method

When you pass a `files` glob, any files in the stream are ignored (you can set your stream src to `read: false`). You can set `fix: true` to have eslint apply fixes directly to the source files on disk. This is mainly useful to simply lint everything and output the results.

```
eslintWrapper({
  files: 'src/scripts/**/*.js',
  fix: true
})
```

> *WARNING*: Autofixing is slightly flakey. It might take two or three passes to fix everything in a file.

### Slow method

When you pass files through the stream (don't pass a `files` options), it will then remove those files from the stream. If you set `fix: true` any fixes are applied, and these fixed files are pushed back into the stream. This is mainly useful to lint individual files, like in a watch callback.

```
eslintWrapper({
  fix: true
})
```

## Dependencies

This package requires ["eslint"](https://www.npmjs.com/package/eslint).

---

Copyright (c) 2019 Elco Klingen. MIT License.
