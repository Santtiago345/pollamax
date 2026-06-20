const ts = require('typescript');
const fs = require('fs');
const path = process.argv[2];
const text = fs.readFileSync(path, 'utf8');
const sf = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([path], { jsx: ts.JsxEmit.Preserve, allowJs: false, skipLibCheck: true, noEmit: true }));
for (const d of diagnostics) {
  const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
  console.log(`${d.file.fileName}:${line+1}:${character+1}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
}
