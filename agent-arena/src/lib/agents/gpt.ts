import OpenAI from 'openai';
import { AgentResponse, GPTModel } from '@/types';

// Lazy initialization to avoid errors if API key is missing
let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return client;
}

export async function callGPT(
  prompt: string,
  modelVariant: GPTModel = 'gpt-4o-mini',
  retryPrompt?: string
): Promise<{ response: AgentResponse | null; rawResponse: string; error?: string }> {
  try {
    const openai = getClient();

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: 'You are an expert game-playing AI that plays to WIN. Always take winning moves when available. Always block opponent winning moves. Think strategically. Respond only with valid JSON as instructed - no markdown, no extra text.' },
      { role: 'user', content: prompt },
    ];

    if (retryPrompt) {
      messages.push({ role: 'assistant', content: 'I apologize for the error.' });
      messages.push({ role: 'user', content: retryPrompt });
    }

    const completion = await openai.chat.completions.create({
      model: modelVariant,
      messages,
      temperature: 0.3,
      max_tokens: 200,
    });

    const rawResponse = completion.choices[0]?.message?.content || '';

    // Try to parse JSON from response
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
    // Try to extract JSON from the response
    let jsonStr = raw.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    // Try to find JSON object in the response
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (typeof parsed.move !== 'number') {
      return { response: null, error: 'Missing or invalid "move" field (must be a number)' };
    }

    return {
      response: {
        move: parsed.move,
        reason: parsed.reason || undefined,
        plan: Array.isArray(parsed.plan) ? parsed.plan : undefined,
      }
    };
  } catch (e) {
    return { response: null, error: 'Invalid JSON format' };
  }
}
