"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = coachRoutes;
const typebox_1 = require("@sinclair/typebox");
const generative_ai_1 = require("@google/generative-ai");
const journal_1 = require("./journal");
// Initialize Gemini
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_API_KEY');
const CoachChatSchema = {
    body: typebox_1.Type.Object({
        message: typebox_1.Type.String(),
    }),
};
async function coachRoutes(server) {
    server.post('/api/v1/coach/chat', {
        preValidation: [server.authenticate],
        schema: CoachChatSchema,
    }, async (request, reply) => {
        const { message } = request.body;
        // Check if it's the dummy key used in the prompt
        if (process.env.GEMINI_API_KEY === 'AIzaSyDu5X9tYXlw2rBQS3_BF8MutGLBRZczR3s' || !process.env.GEMINI_API_KEY) {
            // Return mock coach response
            return reply.send({
                reply: `**Mock AI Coach Mode**\n\nI see you asked: "${message}".\n\nSince you are using the local mock environment without a valid Gemini API key, I am returning a simulated response! To get real AI insights based on your actual journal data, please provide a valid Google Gemini API key in your \`.env\` file.`,
            });
        }
        // 1. Fetch user's trade history to provide as context
        const trades = journal_1.mockTradeEntries.filter(t => t.closedAt !== null).slice(0, 50);
        // Format trades for the prompt
        const contextData = trades.map(t => ({
            pair: t.pair,
            direction: t.direction,
            session: t.session,
            pnlUsd: t.pnlUsd,
            pips: t.pipsResult,
            rr: t.rrActual,
            tags: t.setupTags,
        }));
        // 2. Construct the prompt
        const prompt = `
        You are ForexGPT, a professional forex trading coach.
        You are talking to a retail trader using the ForexOS platform.
        Here is the trader's recent trade history data (in JSON format):
        ${JSON.stringify(contextData)}

        The trader asks: "${message}"

        Analyze the data provided if relevant, and give a concise, actionable, and professional response. 
        Focus on risk management, trading psychology, and statistical edges. Use Markdown formatting.
      `;
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            return reply.send({
                reply: responseText,
            });
        }
        catch (error) {
            server.log.error(error);
            return reply.code(500).send({ error: 'AI_ERROR', message: 'Failed to generate response from Gemini' });
        }
    });
}
