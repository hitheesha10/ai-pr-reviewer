export class CommentFormatter {
  /**
   * Format the top-level review body (shown above inline comments).
   * @param {Array} findings
   * @param {object} meta - { owner, repo, prNumber }
   * @returns {string}
   */
  formatSummary(findings, meta) {
    if (findings.length === 0) {
      return [
        '## 🤖 AI Code Review',
        '',
        'No issues detected. Nice work! ✨',
        '',
        '_Reviewed by Gemini via `ai-pr-reviewer`._',
      ].join('\n');
    }

    const bySeverity = { high: 0, medium: 0, low: 0 };
    for (const f of findings) {
      bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
    }

    const counts = Object.entries(bySeverity)
      .filter(([, n]) => n > 0)
      .map(([sev, n]) => `${n} ${sev}`)
      .join(' · ');

    const lines = [
      '## 🤖 AI Code Review',
      '',
      `Found **${findings.length}** issue${findings.length === 1 ? '' : 's'}: ${counts}`,
      '',
      '| Severity | Type | File:Line | Message |',
      '| --- | --- | --- | --- |',
    ];

    for (const f of findings) {
      lines.push(
        `| ${this.emoji(f.severity)} ${f.severity} | ${f.type} | \`${f.file}:${f.line}\` | ${this.escape(f.message)} |`
      );
    }

    lines.push('');
    lines.push('_Reviewed by Gemini via `ai-pr-reviewer`._');

    return lines.join('\n');
  }

  /**
   * Format a single finding as an inline comment body.
   */
  formatInlineComment(finding) {
    return [
      `**${this.emoji(finding.severity)} ${finding.severity.toUpperCase()} · ${finding.type}**`,
      '',
      finding.message,
      '',
      `> **Suggestion:** ${finding.suggestion}`,
      '',
      `_🤖 ai-pr-reviewer_`,
    ].join('\n');
  }

  emoji(severity) {
    return { high: '🔴', medium: '🟡', low: '🟢' }[severity] || '⚪';
  }

  escape(text) {
    return String(text).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  }
}