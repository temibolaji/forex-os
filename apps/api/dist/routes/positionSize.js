"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = positionSizeRoutes;
const typebox_1 = require("@sinclair/typebox");
const formulas_1 = require("../utils/formulas");
const PositionSizeSchema = {
    body: typebox_1.Type.Object({
        accountBalance: typebox_1.Type.Number(),
        riskPct: typebox_1.Type.Number(),
        pair: typebox_1.Type.String(),
        slPips: typebox_1.Type.Number(),
        accountCurrency: typebox_1.Type.String(),
    }),
};
async function positionSizeRoutes(server) {
    server.post('/api/v1/position-size', {
        preValidation: [server.authenticate],
        schema: PositionSizeSchema,
    }, async (request, reply) => {
        const { accountBalance, riskPct, pair, slPips, accountCurrency } = request.body;
        // In a real implementation, we would convert pip_value_usd to pip_value_account_currency.
        // For now, assume accountCurrency is USD and use getPipValueUsd with a base lot size of 1 to get value per lot.
        const pipValuePerLot = await (0, formulas_1.getPipValueUsd)(pair, 1);
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
    });
}
