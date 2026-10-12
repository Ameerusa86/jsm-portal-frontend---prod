export interface WizardCategoryConfig {
  id: string;
  title: string;
  description: string;
  badge: string;
  iconName: string; // The group name to fetch the icon for (e.g. "incident", "hardware")
  keywords: string[];
}

// ---------------------------------------------------------------------------
// WIZARD CONFIGURATION
// We can freely edit, add, or remove categories here based on your business needs.
// The wizard will automatically route Jira Request Types into these buckets
// by matching the keywords against the request type name and description.
// ---------------------------------------------------------------------------
export const WIZARD_CATEGORIES: WizardCategoryConfig[] = [
  {
    id: "cat-broken",
    title: "Something is Broken",
    description:
      "Report an issue, error, outage, or something that needs fixing.",
    badge: "Incidents & Fixes",
    iconName: "incident",
    keywords: [
      "fix",
      "broken",
      "repair",
      "issue",
      "error",
      "bug",
      "fail",
      "incident",
      "outage",
      "down",
      "problem",
      "not working",
    ],
  },
  {
    id: "cat-new",
    title: "I Need Something New",
    description: "Request new hardware, software licenses, or equipment.",
    badge: "Service Requests",
    iconName: "hardware",
    keywords: [
      "new",
      "request",
      "order",
      "buy",
      "purchase",
      "laptop",
      "phone",
      "software",
      "license",
      "equipment",
      "hardware",
    ],
  },
  {
    id: "cat-access",
    title: "I Need Access",
    description:
      "Get access to systems, reset passwords, or update permissions.",
    badge: "Accounts & Security",
    iconName: "access",
    keywords: [
      "access",
      "password",
      "account",
      "login",
      "permission",
      "reset",
      "unlock",
      "vpn",
      "security",
      "auth",
      "onboard",
    ],
  },
  // Note: The "General Help & Other" fallback category is added automatically in the code
  // for any request types that don't match the keywords above.
];
