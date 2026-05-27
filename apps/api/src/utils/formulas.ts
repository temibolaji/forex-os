export function getPipSize(pair: string): number {
  return pair.endsWith('JPY') ? 0.01 : 0.0001;
}

export function calcPipsRisked(entry: number, sl: number, pair: string): number {
  return Math.abs(entry - sl) / getPipSize(pair);
}

export function calcPipsResult(entry: number, exit: number, direction: 'LONG' | 'SHORT', pair: string): number {
  return ((exit - entry) / getPipSize(pair)) * (direction === 'LONG' ? 1 : -1);
}

export function calcRrPlanned(entry: number, sl: number, tp: number | null | undefined): number | null {
  if (!tp) return null;
  const risk = Math.abs(sl - entry);
  if (risk === 0) return null;
  return Math.abs(tp - entry) / risk;
}

export function calcRrActual(pipsResult: number, pipsRisked: number): number | null {
  if (pipsRisked === 0) return null;
  return pipsResult / pipsRisked;
}

// Stub for pip value - In a real implementation this would fetch rates from Polygon.io
export async function getPipValueUsd(pair: string, lotSize: number): Promise<number> {
  const pipSize = getPipSize(pair);
  const baseValue = lotSize * 100000 * pipSize;
  
  if (pair.endsWith('USD')) {
    return baseValue;
  }
  
  // TODO: Fetch live rate for cross pairs. For now, returning a static approximation.
  // In Phase 2/3, we'll implement Polygon.io fetch here.
  return baseValue; 
}

export async function calcPnlUsd(pipsResult: number, pair: string, lotSize: number): Promise<number> {
  const pipValue = await getPipValueUsd(pair, lotSize);
  return pipsResult * pipValue;
}
