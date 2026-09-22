import { ReviewStrategy } from './ReviewStrategy.js';
import { askJson } from '../../llm/client.js';
import { TEST_COVERAGE_PROMPT } from '../../llm/prompts.js';

export class TestCoverageStrategy extends ReviewStrategy {
  constructor() {
    super('TestCoverageStrategy');
  }

  async analyze(diffText, _context) {
    const result = await askJson(TEST_COVERAGE_PROMPT, diffText);
    return (result.findings || []).map((f) => ({ ...f, type: 'test' }));
  }
}