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
import { postCompilation } from './transformers/chunk/transforms';
import { RenderedChunk } from 'rollup';
import { ChunkTransform } from './transform';
import { ClosureCompilerJS } from './compilerJs';
import { ClosureCompilerCMD } from './compilerCmd';

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

    var compiler: string = process.env.ROLLUP_PLUGIN_CLOSURE_COMPILER_COMPILER || 'javascript';

    if (compiler == 'javascript') {
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
    } else if (compiler.toLowerCase() == 'cmd') {
      const instance = new ClosureCompilerCMD(compileOptions);

      instance.run(async (exitCode: number, code: any, stdErr: string) => {
        if ('warning_level' in compileOptions && compileOptions.warning_level === 'VERBOSE' && stdErr !== '') {
          reject(new Error(`Google Closure Compiler ${stdErr}`));
        } else if (exitCode !== 0) {
          reject(new Error(`Google Closure Compiler exit ${exitCode}: ${stdErr}`));
        } else {
          const postCompiled = await postCompilation(code[0].src, chunk, transforms);
          resolve(postCompiled as any);
        }
      });
    } else {
      throw `bad compiler option ${compiler}`;
    }
  });
}
