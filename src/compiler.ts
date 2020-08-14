/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//@ts-ignore
const jscomp = require('google-closure-compiler-js');
import { postCompilation } from './transformers/chunk/transforms';
import { RenderedChunk } from 'rollup';
import { ChunkTransform } from './transform';

/**
 * Run Closure Compiler and `postCompilation` Transforms on input source.
 * @param compileOptions Closure Compiler CompileOptions, normally derived from Rollup configuration
 * @param transforms Transforms to run rollowing compilation
 * @return Promise<string> source following compilation and Transforms.
 */
export default function (
  compileOptions: any,
  chunk: RenderedChunk,
  transforms: Array<ChunkTransform>,
): Promise<string> {
  return new Promise((resolve: (stdOut: string) => void, reject: (error: any) => void) => {
    console.log(`ClosureCompiler.compileOptions: ${compileOptions}`);
    const instance = new ClosureCompilerJS(compileOptions);
    instance.run(compileOptions.js, async (exitCode: number, code: any, stdErr: string) => {
      if ('warning_level' in compileOptions && compileOptions.warning_level === 'VERBOSE' && stdErr !== '') {
        reject(new Error(`Google Closure Compiler ${stdErr}`));
      } else if (exitCode !== 0) {
        reject(new Error(`Google Closure Compiler exit ${exitCode}: ${stdErr}`));
      } else {
        const postCompiled = await postCompilation(code[0].src, chunk, transforms);
        resolve(postCompiled as any);
      }
    });
  });
}

class ClosureCompilerJS {
  flags: any;

  /** @param {Object<string,string>|Array<string>} flags */
  constructor(flags: any) {
    this.flags = {};
    if (Array.isArray(flags)) {
      flags.forEach((flag) => {
        const flagPargs = flag.split('=');
        const normalizedFlag = this.formatArgument(flagPargs[0], flagPargs[1]);
        this.flags[normalizedFlag.key] = normalizedFlag.val;
      });
    } else {
      for (let key in flags) {
        const normalizedFlag = this.formatArgument(key, flags[key]);
        this.flags[normalizedFlag.key] = normalizedFlag.val;
      }
    }
  }

  /**
   * @param {!Array<!{src: string, path: string, sourceMap: string}>} fileList
   * @param {function(number, Array<{src: string, path: string, sourceMap: (string|undefined)}>, string)=} callback
   * @return {child_process.ChildProcess}
   */
  run(
    fileList: Array<{ src: string; path: string; sourceMap: string }>,
    callback: (exitCode: number, stdOutData: string, stdErrData: string) => any,
  ) {
    const out = jscomp(this.flags, fileList);
    // GWT error and warnings are not true JS arrays, but are array-like.
    // Convert them to standard JS arrays.
    out.warnings = [].slice.call(out.warnings);
    out.errors = [].slice.call(out.errors);
    if (callback) {
      const errors: any[] = [];
      closureCompilerLogErrors(out, fileList, (logOutput) => {
        // The logger uses terminal color markers which we don't want by default.
        errors.push(logOutput.replace(CONSOLE_COLOR_CHARS, ''));
      });
      callback(errors.length === 0 ? 0 : 1, out.compiledFiles, errors.join('\n\n'));
    }
    return out;
  }

  /**
   * @param {string} key
   * @param {(string|boolean)=} val
   * @return {{key: string, val: (string|undefined)}}
   */
  formatArgument(key: string, val: string | undefined) {
    let normalizedKey = key.replace(/_(\w)/g, (match) => match[1].toUpperCase());
    normalizedKey = normalizedKey.replace(/^--/, '');

    return {
      key: normalizedKey,
      val: val === undefined || val === null ? true : val,
    };
  }
}

const ESC = '\u001B';
const CONSOLE_COLOR_CHARS = /\u001B\[\d+m/gu;
const COLOR_END = ESC + '[0m';
const COLOR_RED = ESC + '[91m';
const COLOR_GREEN = ESC + '[92m';
const COLOR_YELLOW = ESC + '[93m';
const fs = require('fs');

/**
 * @param {string} line to generate prefix for
 * @param {number} charNo to generate prefix at
 * @return {string} prefix for showing a caret
 */
function caretPrefix(line: string, charNo: number) {
  return line.substr(0, charNo).replace(/[^\t]/g, ' ');
}

declare interface Msg {
  charNo: number;
  description: string;
  file: string;
  lineNo: number;
  type: string;
}

declare interface Output {
  warnings: void[];
  errors: void[];
}

/**
 * @param {!Object} output
 * @param {!Array<{src:string, path:string}>} inputFiles
 * @param {function(string)} logger
 * @return {boolean} Whether this output should fail a compilation.
 */
function closureCompilerLogErrors(
  output: Output,
  inputFiles: Array<{ src: string; path: string }> = [],
  logger = console.warn,
) {
  // TODO(samthor): If this file has a sourceMap, then follow it back out of the rabbit hole.
  function fileFor(file: string) {
    if (!file) {
      return null;
    }

    const originalFile = inputFiles.find((inputFile) => inputFile.path === file);
    if (originalFile) {
      return originalFile;
    }

    try {
      return {
        path: file,
        src: fs.readFileSync(file, 'utf8'),
      };
    } catch (e) {}
    return null;
  }

  function writemsg(color: string, msg: Msg): void {
    if (!msg.file && msg.lineNo < 0) {
      logger(msg.type);
    } else {
      logger(`${msg.file}:${msg.lineNo} (${msg.type})`);
    }
    logger(msg.description);

    const file = fileFor(msg.file);
    if (file) {
      const lines = file.src.split('\n'); // TODO(samthor): cache this for logger?
      const line = lines[msg.lineNo - 1] || '';
      logger(color + line + COLOR_END);
      logger(COLOR_GREEN + caretPrefix(line, msg.charNo) + '^' + COLOR_END);
    }
    logger('');
  }

  output.warnings.forEach(writemsg.bind(null, COLOR_YELLOW));
  output.errors.forEach(writemsg.bind(null, COLOR_RED));

  return output.errors.length > 0;
}
