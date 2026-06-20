const fs = require('fs');
const ts = require('typescript');
const files = ['src/app/feed/page.tsx', 'src/components/MatchCard.tsx'];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  console.log('FILE:', file);
  const sf = ts.createSourceFile(file, content, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  const diags = sf.parseDiagnostics;
  if (diags.length === 0) {
    console.log('No parse diagnostics');
  } else {
    for (const d of diags) {
      console.log('DIAG', d.messageText, 'pos', d.start, 'len', d.length);
      const { line, character } = sf.getLineAndCharacterOfPosition(d.start || 0);
      console.log(' location:', line + 1, character + 1);
      const startLine = Math.max(0, line - 5);
      const endLine = Math.min(content.split(/\r?\n/).length, line + 5);
      const lines = content.split(/\r?\n/).slice(startLine, endLine);
      for (let i = 0; i < lines.length; i++) {
        console.log((startLine + i + 1).toString().padStart(4) + ': ' + lines[i]);
      }
      console.log('---');
    }
  }
}