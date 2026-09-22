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
    logger.info(`  → ReviewEngine running ${this.strategies.length} strategies`);

    const results = await Promise.allSettled(
      this.strategies.map((s) => s.analyze(diffText, context))
    );

    const findings = [];

    results.forEach((r, i) => {
      const strategy = this.strategies[i];
      if (r.status === 'fulfilled') {
        logger.info(`     • ${strategy.name}: ${r.value.length} findings`);
        findings.push(...r.value);
      } else {
        logger.error(`     • ${strategy.name} failed: ${r.reason.message}`);
      }
    });

    return this.sortBySeverity(findings);
  }

  sortBySeverity(findings) {
    const order = { high: 0, medium: 1, low: 2 };
    return [...findings].sort(
      (a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
    );
  }
}