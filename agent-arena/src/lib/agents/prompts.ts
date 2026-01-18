import { GameType, Player, C4Cell, TTTCell } from '@/types';
import { getTTTBoardForPrompt } from '../games/tictactoe';
import { getC4BoardForPrompt } from '../games/connect4';

export function buildPrompt(
  gameType: GameType,
  board: (TTTCell | C4Cell)[],
  player: Player
): string {
  const gamePrompt = gameType === 'ttt'
    ? getTTTBoardForPrompt(board as TTTCell[], player)
    : getC4BoardForPrompt(board as C4Cell[], player);

  const formatInstructions = getFormatInstructions(gameType);

  return `${gamePrompt}

${formatInstructions}`;
}

function getFormatInstructions(gameType: GameType): string {
  const moveExample = gameType === 'ttt' ? '4' : '3';

  return `=== DECISION PROTOCOL (FOLLOW IN ORDER) ===
1) Immediate win: If any legal move wins now, play it.
2) Immediate block: If the opponent has any immediate winning move next turn, block it.
3) Tactical safety: For each legal move, check the opponent's best reply and avoid moves that allow an immediate loss.
4) Advantage: Prefer moves that create multiple threats, increase future winning lines, and control key positions.
5) Tie-breaker: If multiple moves are similar, choose the safest move that limits opponent threats.

Think through the steps privately. Do NOT output your analysis.

=== RESPONSE FORMAT ===
Return ONLY a single JSON object:
{"move": ${moveExample}, "reason": "short reason"}

RULES:
- "move" must be an integer from the legal moves list
- "reason" must be 1 short sentence
- No markdown, no code blocks, no extra text`;
}

export function buildRetryPrompt(error: string): string {
  return `ERROR: ${error}

CRITICAL: You MUST respond with ONLY a valid JSON object.
- No markdown code blocks
- No explanatory text before or after
- Just the raw JSON: {"move": NUMBER, "reason": "short text"}

Try again with a VALID move from the legal moves list:`;
}
