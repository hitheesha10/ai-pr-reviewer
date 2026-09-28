import { logger } from '../utils/logger.js';

export class ReviewEngine {
  /**
   * @param {ReviewStrategy[]} strategies
   */
  constructor(strategies) {
    this.strategies = strategies;
  }

  /**
   * Run all strategies against the diff.
   * @param {string} diffText
   * @param {object} context
   * @returns {Promise<Array>}
   */
    async run(diffText, context) {
    logger.info(`  → ReviewEngine running ${this.strategies.length} strategies (sequential)`);

    const findings = [];

    for (const strategy of this.strategies) {
      try {
        const result = await strategy.analyze(diffText, context);
        logger.info(`     • ${strategy.name}: ${result.length} findings`);
        findings.push(...result);
      } catch (err) {
        logger.error(`     • ${strategy.name} failed: ${err.message.slice(0, 120)}`);
      }

      // Gap between strategies to reduce pressure on Google's API
      await new Promise((r) => setTimeout(r, 500));
    }

    return this.sortBySeverity(findings);
  }

  sortBySeverity(findings) {
    const order = { high: 0, medium: 1, low: 2 };
    return [...findings].sort(
      (a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
    );
  }
}