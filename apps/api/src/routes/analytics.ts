import { FastifyInstance } from 'fastify';
import { mockTradeEntries } from './journal';

export default async function analyticsRoutes(server: FastifyInstance) {
  server.get(
    '/api/v1/analytics/dashboard',
    { preValidation: [(server as any).authenticate] },
    async (request, reply) => {
      const trades = mockTradeEntries.filter(t => t.closedAt !== null);

      if (trades.length === 0) {
        return reply.send({
          totalTrades: 0,
          winRate: 0,
          profitFactor: 0,
          expectancyUsd: 0,
          avgRR: 0,
        });
      }

      let winningTrades = 0;
      let grossProfit = 0;
      let grossLoss = 0;
      let totalRR = 0;

      for (const trade of trades) {
        const pnl = parseFloat(trade.pnlUsd as string) || 0;
        const rr = parseFloat(trade.rrActual as string) || 0;

        if (pnl > 0) {
          winningTrades++;
          grossProfit += pnl;
        } else {
          grossLoss += Math.abs(pnl);
        }
        totalRR += rr;
      }

      const totalTrades = trades.length;
      const winRate = (winningTrades / totalTrades) * 100;
      const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
      const expectancyUsd = (grossProfit - grossLoss) / totalTrades;
      const avgRR = totalRR / totalTrades;

      return reply.send({
        totalTrades,
        winRate: winRate.toFixed(2),
        profitFactor: profitFactor.toFixed(2),
        expectancyUsd: expectancyUsd.toFixed(2),
        avgRR: avgRR.toFixed(2),
      });
    }
  );

  server.get(
    '/api/v1/analytics/monte-carlo',
    { preValidation: [(server as any).authenticate] },
    async (request, reply) => {
      const { iterations = 1000, tradesCount = 100 } = request.query as any;

      const trades = mockTradeEntries.filter(t => t.closedAt !== null);
      
      let winRate = 0.5; // Default 50%
      let avgWin = 100;
      let avgLoss = 50;

      if (trades.length > 5) {
        let wins = 0;
        let totalWinAmt = 0;
        let totalLossAmt = 0;

        trades.forEach(t => {
          const pnl = parseFloat(t.pnlUsd as string);
          if (pnl > 0) {
            wins++;
            totalWinAmt += pnl;
          } else {
            totalLossAmt += Math.abs(pnl);
          }
        });

        winRate = wins / trades.length;
        if (wins > 0) avgWin = totalWinAmt / wins;
        if (trades.length - wins > 0) avgLoss = totalLossAmt / (trades.length - wins);
      }

      // Monte Carlo Simulation
      let maxDrawdownTotal = 0;
      let finalEquityTotal = 0;

      for (let i = 0; i < iterations; i++) {
        let equity = 0;
        let peak = 0;
        let maxDD = 0;

        for (let j = 0; j < tradesCount; j++) {
          const isWin = Math.random() < winRate;
          equity += isWin ? avgWin : -avgLoss;
          
          if (equity > peak) peak = equity;
          const drawdown = peak - equity;
          if (drawdown > maxDD) maxDD = drawdown;
        }

        maxDrawdownTotal += maxDD;
        finalEquityTotal += equity;
      }

      return reply.send({
        baseStats: { winRate, avgWin, avgLoss },
        simulatedTradesCount: tradesCount,
        iterations,
        expectedMaxDrawdownUsd: (maxDrawdownTotal / iterations).toFixed(2),
        expectedFinalEquityUsd: (finalEquityTotal / iterations).toFixed(2),
      });
    }
  );
}
