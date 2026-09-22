/**
 * Base class for all review strategies.
 * Subclasses must implement analyze().
 */
export class ReviewStrategy {
  constructor(name) {
    this.name = name;
  }

  /**
   * @param {string} diffText
   * @param {object} context - { owner, repo, prNumber }
   * @returns {Promise<Array>} findings
   */
  async analyze(diffText, context) {
    throw new Error(`${this.name}: analyze() must be implemented`);
  }
}