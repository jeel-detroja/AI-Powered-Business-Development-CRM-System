import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';

let _client = null;

const FALLBACK_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-lite-latest',
];

export function getGeminiClient() {
  if (!env.gemini.enabled) return null;
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: env.gemini.apiKey });
  }
  return _client;
}

export function getModelName() {
  return env.gemini.model;
}

export function isAIEnabled() {
  return env.gemini.enabled;
}

function getCandidateModels() {
  const configured = env.gemini.model || 'gemini-flash-lite-latest';
  return [configured, ...FALLBACK_MODELS.filter((m) => m !== configured)];
}

export async function testConnection() {
  if (!env.gemini.enabled) {
    return { connected: false, reason: 'GEMINI_API_KEY is not configured' };
  }

  const client = getGeminiClient();
  const models = getCandidateModels();
  let lastError = null;

  for (const model of models) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: 'Respond with exactly: OK',
      });
      const text = response?.text ?? '';
      return { connected: true, model, response: text.slice(0, 50).trim() };
    } catch (err) {
      lastError = err;
      // If error is about authentication/key itself, don't try other models
      if (err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('permission') || err.status === 403)) {
        break;
      }
    }
  }

  return { connected: false, reason: lastError?.message || 'Connection failed', model: env.gemini.model };
}

export async function generateContent(prompt, { json = false, systemInstruction = '' } = {}) {
  const client = getGeminiClient();
  if (!client) throw new Error('AI is not configured');

  const config = {};
  if (json) {
    config.responseMimeType = 'application/json';
  }
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  const models = getCandidateModels();
  let lastError = null;

  for (const model of models) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.gemini.timeoutMs);

    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config,
      });
      clearTimeout(timeout);

      const text = response?.text ?? '';
      if (json) {
        try {
          return JSON.parse(text);
        } catch {
          const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (match) return JSON.parse(match[1].trim());
          throw new Error('AI returned invalid JSON');
        }
      }
      return text;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;

      if (err.name === 'AbortError') {
        throw new Error('AI request timed out');
      }

      // If invalid key or auth error, don't retry other models
      if (err.message && (err.message.includes('API_KEY_INVALID') || err.status === 403)) {
        throw err;
      }

      console.warn(`[Gemini] Model ${model} failed (${err.message}). Trying fallback...`);
    }
  }

  throw lastError || new Error('Failed to generate content with available Gemini models');
}

export async function generateChatContent({ contents, config = {} }) {
  const client = getGeminiClient();
  if (!client) throw new Error('AI is not configured');

  const models = getCandidateModels();
  let lastError = null;

  // Merge in thinking disabled — prevents thought_signature errors with function calling
  const safeConfig = {
    ...config,
    thinkingConfig: config.thinkingConfig ?? { thinkingBudget: 0 },
  };

  for (const model of models) {
    try {
      const response = await client.models.generateContent({
        model,
        contents,
        config: safeConfig,
      });
      return response;
    } catch (err) {
      lastError = err;
      if (err.message && (err.message.includes('API_KEY_INVALID') || err.status === 403)) {
        throw err;
      }
      console.warn(`[Gemini Chat] Model ${model} failed (${err.message}). Trying fallback...`);
    }
  }

  throw lastError || new Error('Failed to generate chat response with available Gemini models');
}
