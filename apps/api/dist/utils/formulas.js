"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPipSize = getPipSize;
exports.calcPipsRisked = calcPipsRisked;
exports.calcPipsResult = calcPipsResult;
exports.calcRrPlanned = calcRrPlanned;
exports.calcRrActual = calcRrActual;
exports.getPipValueUsd = getPipValueUsd;
exports.calcPnlUsd = calcPnlUsd;
function getPipSize(pair) {
    return pair.endsWith('JPY') ? 0.01 : 0.0001;
}
function calcPipsRisked(entry, sl, pair) {
    return Math.abs(entry - sl) / getPipSize(pair);
}
function calcPipsResult(entry, exit, direction, pair) {
    return ((exit - entry) / getPipSize(pair)) * (direction === 'LONG' ? 1 : -1);
}
function calcRrPlanned(entry, sl, tp) {
    if (!tp)
        return null;
    const risk = Math.abs(sl - entry);
    if (risk === 0)
        return null;
    return Math.abs(tp - entry) / risk;
}
function calcRrActual(pipsResult, pipsRisked) {
    if (pipsRisked === 0)
        return null;
    return pipsResult / pipsRisked;
}
// Stub for pip value - In a real implementation this would fetch rates from Polygon.io
async function getPipValueUsd(pair, lotSize) {
    const pipSize = getPipSize(pair);
    const baseValue = lotSize * 100000 * pipSize;
    if (pair.endsWith('USD')) {
        return baseValue;
    }
    // TODO: Fetch live rate for cross pairs. For now, returning a static approximation.
    // In Phase 2/3, we'll implement Polygon.io fetch here.
    return baseValue;
}
async function calcPnlUsd(pipsResult, pair, lotSize) {
    const pipValue = await getPipValueUsd(pair, lotSize);
    return pipsResult * pipValue;
}
