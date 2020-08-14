const ESC = '\u001B';
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

export function compilerLogOutput(
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
