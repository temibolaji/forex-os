import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import crypto from 'crypto';

const RuleSchema = Type.Object({
  id: Type.String(),
  text: Type.String(),
  required: Type.Boolean(),
});

const CreateTemplateSchema = {
  body: Type.Object({
    name: Type.String({ maxLength: 100 }),
    rules: Type.Array(RuleSchema),
  }),
};

const ResponseSchema = Type.Object({
  ruleId: Type.String(),
  passed: Type.Boolean(),
});

const CreateSnapshotSchema = {
  body: Type.Object({
    templateId: Type.String(),
    responses: Type.Array(ResponseSchema),
  }),
};

// --- MOCK STORES ---
export const mockChecklistTemplates: any[] = [];
export const mockChecklistSnapshots: any[] = [];

export default async function checklistRoutes(server: FastifyInstance) {
  server.get(
    '/api/v1/checklist-templates',
    { preValidation: [(server as any).authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).sub;
      const templates = mockChecklistTemplates.filter(t => t.userId === userId);
      return reply.send({ data: templates });
    }
  );

  server.post(
    '/api/v1/checklist-templates',
    {
      preValidation: [(server as any).authenticate],
      schema: CreateTemplateSchema,
    },
    async (request, reply) => {
      const userId = (request.user as any).sub;
      const { name, rules } = request.body as any;

      const newTemplate = {
        id: crypto.randomUUID(),
        userId,
        name,
        rules,
        createdAt: new Date(),
      };
      
      mockChecklistTemplates.push(newTemplate);

      return reply.code(201).send(newTemplate);
    }
  );

  server.post(
    '/api/v1/checklist-snapshots',
    {
      preValidation: [(server as any).authenticate],
      schema: CreateSnapshotSchema,
    },
    async (request, reply) => {
      const { templateId, responses } = request.body as any;

      const template = mockChecklistTemplates.find(t => t.id === templateId);

      if (!template) {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'Template not found' });
      }

      const rules: Array<{ id: string; required: boolean; text: string }> = template.rules;

      let overallPassed = true;
      const failedRequiredRules: string[] = [];

      for (const rule of rules) {
        if (rule.required) {
          const response = responses.find((r: any) => r.ruleId === rule.id);
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
        id: crypto.randomUUID(),
        templateId,
        responses,
        overallPassed,
        createdAt: new Date(),
      };

      mockChecklistSnapshots.push(snapshot);

      return reply.code(201).send(snapshot);
    }
  );
}
