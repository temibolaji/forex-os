"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = pipCalcRoutes;
const typebox_1 = require("@sinclair/typebox");
const formulas_1 = require("../utils/formulas");
const PipCalcSchema = {
    querystring: typebox_1.Type.Object({
        pair: typebox_1.Type.String(),
        lotSize: typebox_1.Type.Number(),
    })
};
const SpreadSwapSchema = {
    querystring: typebox_1.Type.Object({
        pair: typebox_1.Type.String(),
        lotSize: typebox_1.Type.Number(),
        pips: typebox_1.Type.Number(),
    })
};
async function pipCalcRoutes(server) {
    server.get('/api/v1/pip-value', {
        schema: PipCalcSchema,
    }, async (request, reply) => {
        const { pair, lotSize } = request.query;
        const valueUsd = await (0, formulas_1.getPipValueUsd)(pair, lotSize);
        return reply.send({
            pair,
            lotSize,
            pipValueUsd: valueUsd,
        });
    });
    server.get('/api/v1/spread-cost', {
        schema: SpreadSwapSchema,
    }, async (request, reply) => {
        const { pair, lotSize, pips } = request.query;
        const pipValue = await (0, formulas_1.getPipValueUsd)(pair, lotSize);
        const cost = pipValue * pips;
        return reply.send({
            pair,
            lotSize,
            spreadPips: pips,
            costUsd: cost,
        });
    });
}
