import { ReviewStrategy } from './ReviewStrategy.js';
import { askJson } from '../../llm/client.js';
import { STYLE_PROMPT } from '../../llm/prompts.js';

export class StyleStrategy extends ReviewStrategy {
  constructor() {
    super('StyleStrategy');
  }

  async analyze(diffText, _context) {
    const result = await askJson(STYLE_PROMPT, diffText);
    return (result.findings || []).map((f) => ({ ...f, type: 'style' }));
  }
}