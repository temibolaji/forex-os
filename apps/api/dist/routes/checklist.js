"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockChecklistSnapshots = exports.mockChecklistTemplates = void 0;
exports.default = checklistRoutes;
const typebox_1 = require("@sinclair/typebox");
const crypto_1 = __importDefault(require("crypto"));
const RuleSchema = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    text: typebox_1.Type.String(),
    required: typebox_1.Type.Boolean(),
});
const CreateTemplateSchema = {
    body: typebox_1.Type.Object({
        name: typebox_1.Type.String({ maxLength: 100 }),
        rules: typebox_1.Type.Array(RuleSchema),
    }),
};
const ResponseSchema = typebox_1.Type.Object({
    ruleId: typebox_1.Type.String(),
    passed: typebox_1.Type.Boolean(),
});
const CreateSnapshotSchema = {
    body: typebox_1.Type.Object({
        templateId: typebox_1.Type.String(),
        responses: typebox_1.Type.Array(ResponseSchema),
    }),
};
// --- MOCK STORES ---
exports.mockChecklistTemplates = [];
exports.mockChecklistSnapshots = [];
async function checklistRoutes(server) {
    server.get('/api/v1/checklist-templates', { preValidation: [server.authenticate] }, async (request, reply) => {
        const userId = request.user.sub;
        const templates = exports.mockChecklistTemplates.filter(t => t.userId === userId);
        return reply.send({ data: templates });
    });
    server.post('/api/v1/checklist-templates', {
        preValidation: [server.authenticate],
        schema: CreateTemplateSchema,
    }, async (request, reply) => {
        const userId = request.user.sub;
        const { name, rules } = request.body;
        const newTemplate = {
            id: crypto_1.default.randomUUID(),
            userId,
            name,
            rules,
            createdAt: new Date(),
        };
        exports.mockChecklistTemplates.push(newTemplate);
        return reply.code(201).send(newTemplate);
    });
    server.post('/api/v1/checklist-snapshots', {
        preValidation: [server.authenticate],
        schema: CreateSnapshotSchema,
    }, async (request, reply) => {
        const { templateId, responses } = request.body;
        const template = exports.mockChecklistTemplates.find(t => t.id === templateId);
        if (!template) {
            return reply.code(404).send({ error: 'NOT_FOUND', message: 'Template not found' });
        }
        const rules = template.rules;
        let overallPassed = true;
        const failedRequiredRules = [];
        for (const rule of rules) {
            if (rule.required) {
                const response = responses.find((r) => r.ruleId === rule.id);
                if (!response || !response.passed) {
                    overallPassed = false;
                    failedRequiredRules.push(rule.text);
                }
            }
        }
        if (!overallPassed) {
            return reply.code(422).send({
                error: 'CHECKLIST_FAILED',
                message: 'Required rules were not met',
                failedRules: failedRequiredRules,
            });
        }
        const snapshot = {
            id: crypto_1.default.randomUUID(),
            templateId,
            responses,
            overallPassed,
            createdAt: new Date(),
        };
        exports.mockChecklistSnapshots.push(snapshot);
        return reply.code(201).send(snapshot);
    });
}
