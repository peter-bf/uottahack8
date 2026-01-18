import { NextRequest, NextResponse } from 'next/server';
import { GameType, ModelType, GPTModel, DeepSeekModel, GeminiModel } from '@/types';
import { runMatch } from '@/lib/simulation';
import { saveMatch } from '@/lib/db';

const VALID_GPT_MODELS: GPTModel[] = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
const VALID_DEEPSEEK_MODELS: DeepSeekModel[] = ['deepseek-chat', 'deepseek-reasoner'];
const VALID_GEMINI_MODELS: GeminiModel[] = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro'];

function isValidGameType(val: unknown): val is GameType {
  return val === 'ttt' || val === 'c4';
}

function isValidModelType(val: unknown): val is ModelType {
  return val === 'gpt' || val === 'deepseek' || val === 'gemini';
}

function isValidModelVariant(model: ModelType, variant: unknown): variant is GPTModel | DeepSeekModel | GeminiModel {
  if (model === 'gpt') {
    return VALID_GPT_MODELS.includes(variant as GPTModel);
  } else if (model === 'deepseek') {
    return VALID_DEEPSEEK_MODELS.includes(variant as DeepSeekModel);
  } else {
    return VALID_GEMINI_MODELS.includes(variant as GeminiModel);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    if (!isValidGameType(body.gameType)) {
      return NextResponse.json(
        { error: 'Invalid gameType. Must be "ttt" or "c4".' },
        { status: 400 }
      );
    }

    // Validate Agent A
    if (!body.agentA || !isValidModelType(body.agentA.model)) {
      return NextResponse.json(
        { error: 'Invalid agentA configuration.' },
        { status: 400 }
      );
    }

    if (!isValidModelVariant(body.agentA.model, body.agentA.modelVariant)) {
      return NextResponse.json(
        { error: 'Invalid agentA modelVariant.' },
        { status: 400 }
      );
    }

    // Validate Agent B
    if (!body.agentB || !isValidModelType(body.agentB.model)) {
      return NextResponse.json(
        { error: 'Invalid agentB configuration.' },
        { status: 400 }
      );
    }

    if (!isValidModelVariant(body.agentB.model, body.agentB.modelVariant)) {
      return NextResponse.json(
        { error: 'Invalid agentB modelVariant.' },
        { status: 400 }
      );
    }

    // Run the match
    const result = await runMatch(
      body.gameType,
      {
        model: body.agentA.model,
        modelVariant: body.agentA.modelVariant,
      },
      {
        model: body.agentB.model,
        modelVariant: body.agentB.modelVariant,
      }
    );

    // Save to database
    await saveMatch(result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/play:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
