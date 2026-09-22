import { ReviewStrategy } from './ReviewStrategy.js';
import { askJson } from '../../llm/client.js';
import { BUG_RISK_PROMPT } from '../../llm/prompts.js';

export class BugRiskStrategy extends ReviewStrategy {
  constructor() {
    super('BugRiskStrategy');
  }

  async analyze(diffText, _context) {
    const result = await askJson(BUG_RISK_PROMPT, diffText);
    return (result.findings || []).map((f) => ({ ...f, type: 'bug' }));
  }
}