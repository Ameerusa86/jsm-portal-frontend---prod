// app/lib/classifier.ts

export type CategoryKey = 'WORK_ORDERS' | 'PROBLEMS' | 'AUTOMATIONS' | 'SUGGESTIONS';

export interface RequestTypeClassificationInput {
  name: string;
  description?: string;
  helpText?: string;
  group?: string;
}

export function classifyRequestType(req: RequestTypeClassificationInput): CategoryKey {
  const name = (req.name || '').trim();
  const description = (req.description || '').trim();
  const helpText = (req.helpText || '').trim();
  const group = (req.group || '').trim();

  const titleLower = name.toLowerCase();
  const groupLower = group.toLowerCase();

  const combinedContent = `${name} ${description} ${helpText}`.toLowerCase();

  // 1. Explicit Bracket Tags (e.g. [Work Order], [Problem], [Automation], [Suggestion])
  if (/\[(work\s*order|wo|service\s*request)\]/i.test(name) || /\[(work\s*order|wo|service\s*request)\]/i.test(description)) {
    return 'WORK_ORDERS';
  }
  if (/\[(problem|incident|outage|bug)\]/i.test(name) || /\[(problem|incident|outage|bug)\]/i.test(description)) {
    return 'PROBLEMS';
  }
  if (/\[(automation|report|dashboard|analytics)\]/i.test(name) || /\[(automation|report|dashboard|analytics)\]/i.test(description)) {
    return 'AUTOMATIONS';
  }
  if (/\[(suggestion|idea|feedback)\]/i.test(name) || /\[(suggestion|idea|feedback)\]/i.test(description)) {
    return 'SUGGESTIONS';
  }

  // 2. Native Jira Group Routing (if assigned by Jira admin)
  if (groupLower) {
    if (
      groupLower.includes('work order') ||
      groupLower.includes('service request') ||
      groupLower.includes('logins & accounts') ||
      groupLower.includes('computers & hardware') ||
      groupLower.includes('facilities & access') ||
      groupLower.includes('onboarding') ||
      groupLower.includes('offboarding')
    ) {
      return 'WORK_ORDERS';
    }
    if (
      groupLower.includes('incident') ||
      groupLower.includes('problem') ||
      groupLower.includes('outage') ||
      groupLower.includes('break')
    ) {
      return 'PROBLEMS';
    }
    if (
      groupLower.includes('suggestion') ||
      groupLower.includes('feedback') ||
      groupLower.includes('idea')
    ) {
      return 'SUGGESTIONS';
    }
    if (
      groupLower.includes('automation') ||
      groupLower.includes('data & analytics')
    ) {
      // Guard: if request title is explicitly an employee/client lifecycle (e.g. Winddown or Term),
      // ensure it stays in WORK_ORDERS even if mistakenly placed in a data group.
      const isLifecycle = /\b(winddown|wind[\s-]?down|terms?|terminat(e|ion|ed|ing)|offboard(ing)?|onboard(ing)?|new\s+hire)\b/i.test(titleLower);
      if (!isLifecycle) {
        return 'AUTOMATIONS';
      }
    }
  }

  // 3. Priority Work Orders:
  // Lifecycle, Client Winddown, Employee/Contractor Term, Offboarding, Onboarding,
  // Access requests, Hardware orders, Provisioning, Account tasks.
  // These represent operational service tasks and MUST be under WORK_ORDERS.
  const isWorkOrder =
    // Winddown & Term requests (client winddown, account winddown, employee term, contractor term, termination)
    /\b(winddown|wind[\s-]?down)\b/i.test(titleLower) ||
    /\b(terms?|terminat(e|ion|ed|ing))\b/i.test(titleLower) ||
    /\b(offboard(ing)?|deprovision(ing)?|decommission(ing)?)\b/i.test(titleLower) ||
    /\b(onboard(ing)?|new\s+(hire|employee|contractor|user|intern))\b/i.test(titleLower) ||
    /\b(client\s+winddown|account\s+winddown|employee\s+term|contractor\s+term|user\s+term|termination\s+request)\b/i.test(combinedContent) ||
    // Access & Credentials
    /\b(password\s+(reset|change)|unlock\s+(account|user)|reset\s+(password|mfa|account)|mfa\s+reset|vpn\s+access|request\s+access|grant\s+access|access\s+request|permission\s+request|license\s+request|account\s+request|shared\s+mailbox|distribution\s+list)\b/i.test(titleLower) ||
    // Hardware & Provisioning
    /\b(order\s+(a\s+)?(laptop|computer|monitor|hardware|phone|equipment|desk)|request\s+(a\s+)?(laptop|computer|monitor|hardware|phone|equipment)|hardware\s+(request|order|allocation|setup)|laptop\s+setup|workstation\s+setup)\b/i.test(titleLower) ||
    // Facilities & Services
    /\b(badge|keycard|office\s+move|desk\s+setup|install\s+software|software\s+installation|work\s*order|service\s*request)\b/i.test(titleLower);

  if (isWorkOrder) {
    return 'WORK_ORDERS';
  }

  // 4. Suggestions / Ideas / Recommendations
  const isSuggestion =
    /\b(suggest(ion|ions|ing)?|submit\s+(an?\s+)?idea|feedback|feature\s*request|propose\s+(a\s+)?change|recommendation|system\s+enhancement|enhancement\s+request|portal\s+improvement|workflow\s+improvement)\b/i.test(titleLower) ||
    /\b(\[suggestion\]|\[idea\]|\[feedback\])\b/i.test(combinedContent);

  if (isSuggestion) {
    return 'SUGGESTIONS';
  }

  // 5. Problems / Incidents / Break-Fix
  const isProblem =
    /\b(broken|not\s+working|stopped\s+working|outage|offline|failure|failed|crash(ed|es|ing)?|freeze|frozen|unresponsive|slow|degraded|glitch|bug|malfunction|hardware\s+failure|blue\s+screen|bsod|network\s+down|wifi\s+down|vpn\s+down|system\s+error|error\s+code|cannot\s+access|unable\s+to\s+access|cannot\s+login|unable\s+to\s+login|locked\s+out|troubleshoot|repair\s+request|fix\s+my)\b/i.test(combinedContent) ||
    /\b(problem|incident|outage|help\s*desk|troubleshoot|fix)\b/i.test(titleLower) ||
    /\b(system\s+issue|login\s+issue|network\s+issue|technical\s+issue|hardware\s+issue|software\s+issue|performance\s+issue|having\s+issues?|experiencing\s+issues?)\b/i.test(combinedContent);

  if (isProblem) {
    return 'PROBLEMS';
  }

  // 6. Automations and Reports
  // Specific requests to BUILD or SCHEDULE automated workflows or business analytics reports/dashboards.
  // Strictly guarded against operational terms like "reports to [manager]" or "export mailbox".
  const hasAutomationSignals =
    /\b(request\s+(an?\s+)?automation|build\s+(an?\s+)?automation|new\s+automation|automation\s+request|workflow\s+automation|process\s+automation|rpa|zapier|power\s*automate|etl\s*pipeline|data\s*pipeline|scheduled\s*(job|script|task|cron)|bot\s+request|api\s+integration\s+request)\b/i.test(combinedContent) ||
    /\b(report\s+request|request\s+(a\s+)?report|new\s+report|custom\s+report|scheduled\s+report|bi\s+report|sql\s+report|power\s*bi|tableau|looker|analytics\s+report|reporting\s+dashboard|metrics\s+dashboard|kpi\s+dashboard|dashboard\s+request|create\s+(a\s+)?(report|dashboard)|build\s+(a\s+)?(report|dashboard)|data\s+extract\s+request|data\s+analytics\s+request|business\s+intelligence)\b/i.test(combinedContent) ||
    (/\b(automation|automate|dashboard|etl|pipeline|powerbi|tableau)\b/i.test(titleLower) && !/\b(dashboard\s+access|powerbi\s+license)\b/i.test(titleLower)) ||
    (/\b(report|reports)\b/i.test(titleLower) && !/\b(report\s+(an?\s+)?(problem|incident|issue|bug|outage|damage)|reports?\s+to)\b/i.test(titleLower));

  if (hasAutomationSignals) {
    return 'AUTOMATIONS';
  }

  // 7. General Suggestions fallback if title or text implies idea/feedback
  if (/\b(suggest|idea|feedback|improv)\b/i.test(combinedContent)) {
    return 'SUGGESTIONS';
  }

  // 8. Default fallback for standard operational requests -> Work Orders
  return 'WORK_ORDERS';
}
