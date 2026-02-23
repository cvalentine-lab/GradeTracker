/**
 * Verify OpenAI API key is set and working.
 * Run from project root: node backend/scripts/check-openai.js
 * Or from backend: node scripts/check-openai.js
 */
import dotenv from 'dotenv';
import * as ai from '../services/ai.js';

dotenv.config();

console.log('Checking OpenAI API...');
const result = await ai.verifyApiKey();

if (result.ok) {
  console.log('✓ OpenAI API is working');
} else {
  console.log('✗', result.error || 'OpenAI API check failed');
  process.exit(1);
}
