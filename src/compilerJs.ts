import { compilerLogOutput } from './compilerLogger';
const jscomp = require('google-closure-compiler-js');
const CONSOLE_COLOR_CHARS = /\u001B\[\d+m/gu;

export class ClosureCompilerJS {
  compileOptions: any;

  constructor(compileOptions: { [k: string]: string } | Array<string>) {
    this.compileOptions = {};
    if (Array.isArray(compileOptions)) {
      compileOptions.forEach((flag) => {
        const flagPargs = flag.split('=');
        const normalizedFlag = this.formatArgument(flagPargs[0], flagPargs[1]);
        this.compileOptions[normalizedFlag.key] = normalizedFlag.val;
      });
    } else {
      for (let key in compileOptions) {
        const normalizedFlag = this.formatArgument(key, compileOptions[key]);
        this.compileOptions[normalizedFlag.key] = normalizedFlag.val;
      }
    }
  }

  run(
    // fileList: Array<{ src: string; path: string; sourceMap: string }>,
    sourcePath: string,
    callback: (exitCode: number, stdOutData: string, stdErrData: string) => any,
  ): void {
    debugger;
    const out = jscomp(this.compileOptions, sourcePath);
    // GWT error and warnings are not true JS arrays, but are array-like.
    // Convert them to standard JS arrays.
    out.warnings = [].slice.call(out.warnings);
    out.errors = [].slice.call(out.errors);
    if (callback) {
      const errors: any[] = [];
      compilerLogOutput(out, [{ src: '', path: sourcePath, sourceMap: '' }], (logOutput) => {
        // The logger uses terminal color markers which we don't want by default.
        errors.push(logOutput.replace(CONSOLE_COLOR_CHARS, ''));
      });
      callback(errors.length === 0 ? 0 : 1, out.compiledFiles, errors.join('\n\n'));
    }
    return out;
  }

  formatArgument(key: string, val: string | undefined) {
    let normalizedKey = key.replace(/_(\w)/g, (match) => match[1].toUpperCase());
    normalizedKey = normalizedKey.replace(/^--/, '');

    return {
      key: normalizedKey,
      val: val === undefined || val === null ? true : val,
    };
  }
}
