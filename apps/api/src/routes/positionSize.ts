import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { getPipValueUsd } from '../utils/formulas';

const PositionSizeSchema = {
  body: Type.Object({
    accountBalance: Type.Number(),
    riskPct: Type.Number(),
    pair: Type.String(),
    slPips: Type.Number(),
    accountCurrency: Type.String(),
  }),
};

export default async function positionSizeRoutes(server: FastifyInstance) {
  server.post(
    '/api/v1/position-size',
    {
      preValidation: [(server as any).authenticate],
      schema: PositionSizeSchema,
    },
    async (request, reply) => {
      const { accountBalance, riskPct, pair, slPips, accountCurrency } = request.body as any;

      // In a real implementation, we would convert pip_value_usd to pip_value_account_currency.
      // For now, assume accountCurrency is USD and use getPipValueUsd with a base lot size of 1 to get value per lot.
      const pipValuePerLot = await getPipValueUsd(pair, 1);
      
      const monetaryRisk = accountBalance * (riskPct / 100);
      let lotSize = monetaryRisk / (slPips * pipValuePerLot);
      
      // Round down to 2 decimal places
      lotSize = Math.floor(lotSize * 100) / 100;
      
      const riskAmountActual = lotSize * slPips * pipValuePerLot;
      const riskPctActual = (riskAmountActual / accountBalance) * 100;

      return reply.send({
        lotSize,
        monetaryRisk: riskAmountActual,
        pipValueAccountCurrency: pipValuePerLot,
        riskPctActual,
      });
    }
  );
}
