import { AgentResponse, GeminiModel } from '@/types';

const DEFAULT_MODEL: GeminiModel = 'gemini-2.0-flash';

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return apiKey;
}

export async function callGemini(
  prompt: string,
  modelVariant: GeminiModel = DEFAULT_MODEL,
  retryPrompt?: string
): Promise<{ response: AgentResponse | null; rawResponse: string; error?: string }> {
  try {
    const systemPrompt = 'You are an expert game-playing AI that plays to WIN. Always take winning moves when available. Always block opponent winning moves. Think strategically. Respond only with valid JSON as instructed - no markdown, no extra text.';
    const fullPrompt = retryPrompt
      ? `${systemPrompt}\n\n${prompt}\n\n${retryPrompt}`
      : `${systemPrompt}\n\n${prompt}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelVariant}:generateContent?key=${getApiKey()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: fullPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 200,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { response: null, rawResponse: '', error: `API Error: ${errorText}` };
    }

    const data = await response.json();
    const rawResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const parsed = parseAgentResponse(rawResponse);
    if (parsed.error) {
      return { response: null, rawResponse, error: parsed.error };
    }

    return { response: parsed.response, rawResponse };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return { response: null, rawResponse: '', error: `API Error: ${error}` };
  }
}

function parseAgentResponse(raw: string): { response: AgentResponse | null; error?: string } {
  try {
    let jsonStr = raw.trim();

    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    if (typeof parsed.move !== 'number') {
      return { response: null, error: 'Missing or invalid "move" field (must be a number)' };
    }

    return {
      response: {
        move: parsed.move,
        reason: parsed.reason || undefined,
        plan: Array.isArray(parsed.plan) ? parsed.plan : undefined,
      },
    };
  } catch (e) {
    return { response: null, error: 'Invalid JSON format' };
  }
}
