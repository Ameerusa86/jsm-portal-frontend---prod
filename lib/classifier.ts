// app/lib/classifier.ts
export type CategoryKey = 'WORK_ORDERS' | 'PROBLEMS' | 'AUTOMATIONS' | 'SUGGESTIONS';

const RULES: Record<Exclude<CategoryKey, 'WORK_ORDERS'>, RegExp[]> = {
  PROBLEMS: [/\[problem\]/i, /problem/i, /broken/i, /error/i, /issue/i, /hardware failure/i],
  AUTOMATIONS: [/\[automation\]/i, /automat/i, /report/i, /dashboard/i, /export/i],
  SUGGESTIONS: [/\[suggestion\]/i, /suggest/i, /idea/i, /feedback/i, /improv/i],
};

export function classifyRequestType(req: { name: string; description?: string; helpText?: string }): CategoryKey {
  // Combine the Description and the Instruction (helpText) fields. 
  // We omit req.name so the title does not influence the routing.
  const textToEvaluate = `${req.description || ''} ${req.helpText || ''}`;

  for (const [category, patterns] of Object.entries(RULES)) {
    if (patterns.some(p => p.test(textToEvaluate))) {
      return category as CategoryKey;
    }
  }

  return 'WORK_ORDERS'; // Fallback for uncategorized request types
}
