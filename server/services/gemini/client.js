import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';

let _client = null;

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

export async function testConnection() {
  if (!env.gemini.enabled) {
    return { connected: false, reason: 'GEMINI_API_KEY is not configured' };
  }
  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: env.gemini.model,
      contents: 'Respond with exactly: OK',
    });
    const text = response?.text ?? '';
    return { connected: true, model: env.gemini.model, response: text.slice(0, 50) };
  } catch (err) {
    return { connected: false, reason: err.message, model: env.gemini.model };
  }
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.gemini.timeoutMs);

  try {
    const response = await client.models.generateContent({
      model: env.gemini.model,
      contents: prompt,
      config,
    });
    clearTimeout(timeout);
    const text = response?.text ?? '';
    if (json) {
      try {
        return JSON.parse(text);
      } catch {
        // Try to extract JSON from markdown code blocks
        const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) return JSON.parse(match[1].trim());
        throw new Error('AI returned invalid JSON');
      }
    }
    return text;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('AI request timed out');
    throw err;
  }
}
