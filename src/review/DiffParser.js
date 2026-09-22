export class DiffParser {
  /**
   * Parse a unified diff string into structured changes.
   * @param {string} diffText
   * @returns {Array<{ file: string, changes: Array<{ lineNumber: number, type: 'add'|'del'|'context', content: string }> }>}
   */
  parse(diffText) {
    const files = [];
    const lines = diffText.split('\n');

    let currentFile = null;
    let newLineNumber = 0;

    for (const line of lines) {
      if (line.startsWith('+++ b/')) {
        currentFile = { file: line.slice(6), changes: [] };
        files.push(currentFile);
        continue;
      }

      if (line.startsWith('@@')) {
        const match = line.match(/\+(\d+)/);
        if (match) newLineNumber = parseInt(match[1], 10);
        continue;
      }

      if (!currentFile) continue;

      if (line.startsWith('+') && !line.startsWith('+++')) {
        currentFile.changes.push({
          lineNumber: newLineNumber,
          type: 'add',
          content: line.slice(1),
        });
        newLineNumber++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        currentFile.changes.push({
          lineNumber: newLineNumber,
          type: 'del',
          content: line.slice(1),
        });
      } else {
        newLineNumber++;
      }
    }

    return files;
  }

  toAddedLinesText(parsed) {
    return parsed
      .map((f) => {
        const added = f.changes.filter((c) => c.type === 'add');
        if (added.length === 0) return '';
        return [
          `# ${f.file}`,
          ...added.map((c) => `${c.lineNumber}: ${c.content}`),
        ].join('\n');
      })
      .filter(Boolean)
      .join('\n\n');
  }
}