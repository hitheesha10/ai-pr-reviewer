const TYPE_LABEL = {
  bug: 'Bug',
  style: 'Style',
  test: 'Tests',
};

export default function FindingItem({ finding }) {
  return (
    <div className={`finding ${finding.severity}`}>
      <div className="finding-head">
        <span>{finding.severity} · {TYPE_LABEL[finding.type] || finding.type}</span>
        <span style={{ fontFamily: 'ui-monospace, monospace' }}>
          {finding.file}:{finding.line}
        </span>
      </div>
      <p className="finding-msg">{finding.message}</p>
      {finding.suggestion && (
        <p className="finding-suggestion">→ {finding.suggestion}</p>
      )}
    </div>
  );
}