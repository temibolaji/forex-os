import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { getPipValueUsd } from '../utils/formulas';

const PipCalcSchema = {
  querystring: Type.Object({
    pair: Type.String(),
    lotSize: Type.Number(),
  })
};

const SpreadSwapSchema = {
  querystring: Type.Object({
    pair: Type.String(),
    lotSize: Type.Number(),
    pips: Type.Number(),
  })
};

export default async function pipCalcRoutes(server: FastifyInstance) {
  server.get(
    '/api/v1/pip-value',
    {
      schema: PipCalcSchema,
    },
    async (request, reply) => {
      const { pair, lotSize } = request.query as any;
      const valueUsd = await getPipValueUsd(pair, lotSize);
      return reply.send({
        pair,
        lotSize,
        pipValueUsd: valueUsd,
      });
    }
  );

  server.get(
    '/api/v1/spread-cost',
    {
      schema: SpreadSwapSchema,
    },
    async (request, reply) => {
      const { pair, lotSize, pips } = request.query as any;
      const pipValue = await getPipValueUsd(pair, lotSize);
      const cost = pipValue * pips;
      
      return reply.send({
        pair,
        lotSize,
        spreadPips: pips,
        costUsd: cost,
      });
    }
  );
}
