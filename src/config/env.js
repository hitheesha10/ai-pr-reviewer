import 'dotenv/config';

const required = ['GITHUB_WEBHOOK_SECRET', 'GITHUB_TOKEN', 'GEMINI_API_KEY'];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[env] Missing required env var: ${key}`);
    process.exit(1);
  }
}

export const env = {
  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  githubToken: process.env.GITHUB_TOKEN,
  geminiApiKey: process.env.GEMINI_API_KEY,
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
};