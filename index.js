// Small vinyl-stream wrapper -aka Gulp plugin- for ESLint
// Supports autofixing of files via `options.eslint.fix: true`.
//
// Fast option:
//   Pass a `files` glob string.
//   Files in the stream are ignored. You can set your stream src to `{ read: false }`.
//   If you set `options.fix: true` then fixes are applied to source files directly on disk.
//   WARNING: Autofixing is flakey - sometimes needs multiple passes.
// Slow option:
//   Pass files through the stream (not a `files` string).
//   Files are removed from the stream.
//   Files with fixes (if any) are pushed back into the stream.
//   Use this if you need more control, or need to do extra pre- or post- processing of files.

const { join, relative } = require('path')
const { Transform } = require('stream')

const DEFAULT_OPTIONS = {
  config: false,
  failOnError: false,

  eslint: {
    allowInlineConfig: true,
    cache: true,
    cacheLocation: join(process.cwd(), 'node_modules/.cache/eslint/'),
    cwd: process.cwd(),
    fix: true,
    fixTypes: ['problem', 'suggestion', 'layout'],
    ignore: true,
    reportUnusedDisableDirectives: null,
    globInputPaths: true,
  },
}

function outputFormatter(output = '') {
  output = output.toString().trim()
  return (output ? `\n${output.replace('\n\n\n', '\n\n')}\n` : '').trim()
}

function eslintWrapper(options = {}) {
  options = { ...DEFAULT_OPTIONS, ...options }
  options.eslint = { ...DEFAULT_OPTIONS.eslint, ...options.eslint }

  if (typeof options.config === 'object') {
    options.eslint = { ...options.eslint, baseConfig: options.config, overrideConfigFile: null, useEslintrc: false }
  } else if (typeof options.config === 'string') {
    options.eslint = { ...options.eslint, baseConfig: null, overrideConfigFile: options.config, useEslintrc: false }
  } else {
    options.eslint = { ...options.eslint, baseConfig: null, overrideConfigFile: null, useEslintrc: true }
  }

  if (options.files) {
    return eslintGlobWrapper(options)
  }

  return eslintVinylWrapper(options)
}

function eslintGlobWrapper(options = {}) {
  //const CLIEngine = require('eslint').CLIEngine
  //const cli = new CLIEngine(options.eslint)
  //const formatter = cli.getFormatter('stylish')
  const { ESLint } = require('eslint')

  function transform(file, encoding, callback) {
    return callback(null, file) // Any files in the stream are ignored
  }

  async function flush(callback) {
    const eslint = new ESLint(options.eslint)

    //const report = cli.executeOnFiles(options.files, process.cwd())
    const results = await eslint.lintFiles(options.files, process.cwd())

    if (options.eslint.fix) {
      ESLint.outputFixes(results)
    }

    const revisedResults = results.filter(result => !result.output)
    const formatter = await eslint.loadFormatter('stylish')
    const output = outputFormatter(formatter.format(revisedResults))

    if (output && options.failAfterError) {
      return callback(new Error(output))
    }

    if (output) {
      console.log(output)
    }

    return callback()
  }

  return new Transform({ transform, flush, readableObjectMode: true, writableObjectMode: true })
}

function eslintVinylWrapper(options = {}) {
  const eslint = new ESLint(options.eslint)

  async function transform(file, encoding, callback) {
    if (await eslint.isPathIgnored(relative(process.cwd(), file.path))) {
      return callback()
    }

    const results = await eslint.lintText(file.contents.toString(), relative(process.cwd(), file.path))

    if (options.eslint.fix) {
      const result = results[0]

      // Somehow, this is flakey - sometimes needs multiple passes to fix everything..
      if (result.output && !result.messages.length && result.output !== file.contents.toString('utf8')) {
        file.contents = Buffer.from(result.output)
        return callback(null, file)
      }
    }

    const revisedResults = results.filter(result => !result.output)
    const formatter = await eslint.loadFormatter('stylish')
    const output = outputFormatter(formatter.format(revisedResults))

    if (output && options.failAfterError) {
      return callback(new Error(output))
    }

    if (output) {
      console.log(output)
    }

    return callback()
  }

  return new Transform({ transform, readableObjectMode: true, writableObjectMode: true })
}

module.exports = eslintWrapper
