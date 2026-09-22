import { Octokit } from '@octokit/rest';
import { env } from '../config/env.js';

export const octokit = new Octokit({
  auth: env.githubToken,
  userAgent: 'ai-pr-reviewer/1.0.0',
});