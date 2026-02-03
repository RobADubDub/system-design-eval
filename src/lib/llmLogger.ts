/**
 * Structured LLM logging - outputs to console in a format that works both
 * locally (terminal) and in production (cloud logging services).
 *
 * View logs:
 * - Local: Check the terminal running `npm run dev`
 * - Production: Check your cloud platform's log viewer
 */

interface LLMLogEntry {
  timestamp: string;
  type: 'chat' | 'analyze' | 'flow' | 'notes-assist';
  direction: 'request' | 'response';
  durationMs?: number;
  data: Record<string, unknown>;
}

export function logLLMRequest(
  type: LLMLogEntry['type'],
  data: Record<string, unknown>
): { startTime: number } {
  const entry: LLMLogEntry = {
    timestamp: new Date().toISOString(),
    type,
    direction: 'request',
    data,
  };

  console.log('\n' + '='.repeat(80));
  console.log(`[LLM ${type.toUpperCase()} REQUEST]`, entry.timestamp);
  console.log(JSON.stringify(entry.data, null, 2));

  return { startTime: Date.now() };
}

export function logLLMResponse(
  type: LLMLogEntry['type'],
  data: Record<string, unknown>,
  startTime?: number
): void {
  const entry: LLMLogEntry = {
    timestamp: new Date().toISOString(),
    type,
    direction: 'response',
    durationMs: startTime ? Date.now() - startTime : undefined,
    data,
  };

  console.log('-'.repeat(40));
  console.log(
    `[LLM ${type.toUpperCase()} RESPONSE]`,
    entry.timestamp,
    entry.durationMs ? `(${entry.durationMs}ms)` : ''
  );
  console.log(JSON.stringify(entry.data, null, 2));
  console.log('='.repeat(80) + '\n');
}
