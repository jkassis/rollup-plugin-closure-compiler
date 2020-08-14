'use strict';

// import { compilerLogOutput } from './compilerLogger';
import { spawn } from 'child_process';

export class ClosureCompilerCMD {
  commandArguments: Array<string>;
  extraCommandArgs: Array<string>;
  spawnOptions: any;

  constructor(args: { [k: string]: string } | Array<string>, extraCommandArgs: Array<string> = []) {
    this.commandArguments = [];
    this.extraCommandArgs = extraCommandArgs;

    if (Array.isArray(args)) {
      this.commandArguments = this.commandArguments.concat(args.slice());
    } else {
      for (let key in args) {
        if (Array.isArray(args[key])) {
          for (let i = 0; i < args[key].length; i++) {
            this.commandArguments.push(this.formatArgument(key, args[key][i]));
          }
        } else {
          this.commandArguments.push(this.formatArgument(key, args[key]));
        }
      }
    }
  }

  // spawn options:
  //
  // cwd <string> Current working directory of the child process.
  // env <Object> Environment key-value pairs. Default: process.env.
  // argv0 <string> Explicitly set the value of argv[0] sent to the child process. This will be set to command if not specified.
  // stdio <Array> | <string> Child's stdio configuration (see options.stdio).
  // detached <boolean> Prepare child to run independently of its parent process. Specific behavior depends on the platform, see options.detached).
  // uid <number> Sets the user identity of the process (see setuid(2)).
  // gid <number> Sets the group identity of the process (see setgid(2)).
  // serialization <string> Specify the kind of serialization used for sending messages between processes. Possible values are 'json' and 'advanced'. See Advanced serialization for more details. Default: 'json'.
  // shell <boolean> | <string> If true, runs command inside of a shell. Uses '/bin/sh' on Unix, and process.env.ComSpec on Windows. A different shell can be specified as a string. See Shell requirements and Default Windows shell. Default: false (no shell).
  // windowsVerbatimArguments <boolean> No quoting or escaping of arguments is done on Windows. Ignored on Unix. This is set to true automatically when shell is specified and is CMD. Default: false.
  // windowsHide <boolean> Hide the subprocess console window that would normally be created on Windows systems. Default: false.

  /**
   * @param {function(number, string, string)=} callback
   * @return {child_process.ChildProcess}
   */
  run(callback: (exitCode: number, stdOutData: string, stdErrData: string) => any) {
    if (this.extraCommandArgs) {
      this.commandArguments.unshift(...this.extraCommandArgs);
    }

    console.warn(this.getFullCommand() + '\n');
    let compileProcess = spawn('closure-compiler', this.commandArguments, this.spawnOptions);

    let stdOutData = '';
    let stdErrData = '';
    if (callback) {
      if (compileProcess.stdout) {
        compileProcess.stdout.setEncoding('utf8');
        compileProcess.stdout.on('data', (data: string) => {
          stdOutData += data;
        });
        compileProcess.stdout.on('error', (err) => {
          stdErrData += err.toString();
        });
      }

      if (compileProcess.stderr) {
        compileProcess.stderr.setEncoding('utf8');
        compileProcess.stderr.on('data', (data) => {
          stdErrData += data;
        });
      }

      compileProcess.on('close', (code) => {
        if (code !== 0) {
          stdErrData = this.prependFullCommand(stdErrData);
        }

        callback(code, stdOutData, stdErrData);
      });

      compileProcess.on('error', (err) => {
        callback(1, stdOutData, this.prependFullCommand('Process spawn error. Is java in the path?\n' + err.message));
      });
    }

    return compileProcess;
  }

  /**
   * @return {string}
   */
  getFullCommand() {
    return 'closure_compiler ' + this.commandArguments.join(' ');
  }

  /**
   * @param {string} msg
   * @return {string}
   */
  prependFullCommand(msg: string) {
    return this.getFullCommand() + '\n\n' + msg + '\n\n';
  }

  /**
   * @param {string} key
   * @param {(string|boolean)=} val
   * @return {string}
   */
  formatArgument(key: string, val: string) {
    let normalizedKey = key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
    normalizedKey = normalizedKey.replace(/^--/, '');

    if (val === undefined || val === null) {
      return `--${normalizedKey}`;
    }

    return `--${normalizedKey}=${val}`;
  }
}

/** @type {Object<string, string>} */
ClosureCompilerCMD.prototype.spawnOptions = undefined;
