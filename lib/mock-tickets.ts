// lib/mock-tickets.ts
import { TicketItem, TicketDetail } from "@/types/jsm";

const now = Date.now();
const hour = 3600 * 1000;
const day = 24 * hour;

export const MOCK_TICKETS: TicketItem[] = [
  {
    id: "mock-1042",
    key: "IT-1042",
    summary: "MacBook Pro M3 Hardware Diagnostics & Battery Replacement",
    status: "In Progress",
    statusCategory: "indeterminate",
    statusCategoryName: "In Progress",
    type: "Hardware Support",
    clientName: "Metro Emergency Medical Services",
    organization: "Metro Emergency Medical Services",
    projectId: "4",
    projectName: "Information Technology",
    projectKey: "IT",
    priority: { name: "High" },
    reporter: {
      displayName: "You (Employee)",
      emailAddress: "employee@emsmc.com",
    },
    assignee: {
      displayName: "Sarah Jenkins",
      emailAddress: "sarah.jenkins@enterprise.com",
    },
    created: new Date(now - 2 * day).toISOString(),
    updated: new Date(now - 3 * hour).toISOString(),
  },
  {
    id: "mock-1038",
    key: "IT-1038",
    summary: "Request AWS Production Access for Data Analytics Team",
    status: "Waiting for support",
    statusCategory: "new",
    statusCategoryName: "To Do",
    type: "System Access Request",
    clientName: "Wake County EMS Alliance",
    organization: "Wake County EMS Alliance",
    projectId: "4",
    projectName: "Information Technology",
    projectKey: "IT",
    priority: { name: "Medium" },
    reporter: {
      displayName: "You (Employee)",
      emailAddress: "employee@emsmc.com",
    },
    assignee: {
      displayName: "David Chen",
      emailAddress: "david.chen@enterprise.com",
    },
    created: new Date(now - 3 * day).toISOString(),
    updated: new Date(now - 1 * day).toISOString(),
  },
  {
    id: "mock-512",
    key: "HR-512",
    summary: "Remote Work Equipment Allowance Reimbursement",
    status: "Resolved",
    statusCategory: "done",
    statusCategoryName: "Done",
    type: "Expense Reimbursement",
    clientName: "EMSMC Corporate Headquarters",
    organization: "EMSMC Corporate Headquarters",
    projectId: "3",
    projectName: "Human Resources",
    projectKey: "HR",
    priority: { name: "Medium" },
    reporter: {
      displayName: "You (Employee)",
      emailAddress: "employee@emsmc.com",
    },
    assignee: {
      displayName: "Emily Watson",
      emailAddress: "emily.watson@enterprise.com",
    },
    created: new Date(now - 10 * day).toISOString(),
    updated: new Date(now - 5 * day).toISOString(),
    resolution: {
      name: "Done",
      date: new Date(now - 5 * day).toISOString(),
    },
  },
  {
    id: "mock-204",
    key: "BILL-204",
    summary: "Clarification on Q3 EMS Transport Billing Invoices",
    status: "Waiting for Customer",
    statusCategory: "indeterminate",
    statusCategoryName: "Waiting for Customer",
    type: "Billing Inquiry",
    clientName: "Tri-County Fire & EMS",
    organization: "Tri-County Fire & EMS",
    projectId: "2",
    projectName: "Billing & Revenue",
    projectKey: "BILL",
    priority: { name: "High" },
    reporter: {
      displayName: "You (Employee)",
      emailAddress: "employee@emsmc.com",
    },
    assignee: {
      displayName: "Rachel Green",
      emailAddress: "rachel.green@enterprise.com",
    },
    created: new Date(now - 4 * day).toISOString(),
    updated: new Date(now - 4 * hour).toISOString(),
  },
  {
    id: "mock-319",
    key: "OPS-319",
    summary: "Cadence Dispatch Portal Integration Sync Timeout",
    status: "Under Review",
    statusCategory: "indeterminate",
    statusCategoryName: "Under Review",
    type: "Technical Incident",
    clientName: "Cadence Dispatch Communications",
    organization: "Cadence Dispatch Communications",
    projectId: "5",
    projectName: "Client Operations",
    projectKey: "OPS",
    priority: { name: "Highest" },
    reporter: {
      displayName: "You (Employee)",
      emailAddress: "employee@emsmc.com",
    },
    assignee: {
      displayName: "Ameer Hassan",
      emailAddress: "ameer.hassan@enterprise.com",
    },
    created: new Date(now - 1 * day).toISOString(),
    updated: new Date(now - 35 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-992",
    key: "IT-992",
    summary: "Corporate GlobalProtect VPN Certificate Renewal",
    status: "Closed",
    statusCategory: "done",
    statusCategoryName: "Done",
    type: "IT Security",
    clientName: "Metro Emergency Medical Services",
    organization: "Metro Emergency Medical Services",
    projectId: "4",
    projectName: "Information Technology",
    projectKey: "IT",
    priority: { name: "Low" },
    reporter: {
      displayName: "You (Employee)",
      emailAddress: "employee@emsmc.com",
    },
    assignee: {
      displayName: "Alex Morgan",
      emailAddress: "alex.morgan@enterprise.com",
    },
    created: new Date(now - 14 * day).toISOString(),
    updated: new Date(now - 12 * day).toISOString(),
    resolution: {
      name: "Fixed",
      date: new Date(now - 12 * day).toISOString(),
    },
  },
  {
    id: "mock-875",
    key: "IT-875",
    summary: "Dual 4K Dell UltraSharp Monitors for Design Workstation",
    status: "Closed",
    statusCategory: "done",
    statusCategoryName: "Done",
    type: "Hardware Support",
    clientName: "Piedmont Regional EMS",
    organization: "Piedmont Regional EMS",
    projectId: "4",
    projectName: "Information Technology",
    projectKey: "IT",
    priority: { name: "Low" },
    reporter: {
      displayName: "You (Employee)",
      emailAddress: "employee@emsmc.com",
    },
    assignee: {
      displayName: "Sarah Jenkins",
      emailAddress: "sarah.jenkins@enterprise.com",
    },
    created: new Date(now - 25 * day).toISOString(),
    updated: new Date(now - 20 * day).toISOString(),
    resolution: {
      name: "Completed",
      date: new Date(now - 20 * day).toISOString(),
    },
  },
  {
    id: "mock-115",
    key: "SEC-115",
    summary: "SOC2 Access Review & Multi-Factor Auth Verification",
    status: "Waiting for support",
    statusCategory: "new",
    statusCategoryName: "To Do",
    type: "Compliance & Security",
    clientName: "EMSMC Corporate Headquarters",
    organization: "EMSMC Corporate Headquarters",
    projectId: "4",
    projectName: "Information Technology",
    projectKey: "IT",
    priority: { name: "High" },
    reporter: {
      displayName: "You (Employee)",
      emailAddress: "employee@emsmc.com",
    },
    assignee: {
      displayName: "Alex Morgan",
      emailAddress: "alex.morgan@enterprise.com",
    },
    created: new Date(now - 5 * day).toISOString(),
    updated: new Date(now - 2 * day).toISOString(),
  },
  {
    id: "mock-195",
    key: "BILL-195",
    summary: "Update Department Cost Center Codes for Fiscal Year 2027",
    status: "Resolved",
    statusCategory: "done",
    statusCategoryName: "Done",
    type: "Accounting Update",
    clientName: "Tri-County Fire & EMS",
    organization: "Tri-County Fire & EMS",
    projectId: "2",
    projectName: "Billing & Revenue",
    projectKey: "BILL",
    priority: { name: "Medium" },
    reporter: {
      displayName: "You (Employee)",
      emailAddress: "employee@emsmc.com",
    },
    assignee: {
      displayName: "Michael Brown",
      emailAddress: "michael.brown@enterprise.com",
    },
    created: new Date(now - 35 * day).toISOString(),
    updated: new Date(now - 30 * day).toISOString(),
    resolution: {
      name: "Approved",
      date: new Date(now - 30 * day).toISOString(),
    },
  },
];

export function getMockTicketDetail(ticketKey: string, userName?: string, userEmail?: string): TicketDetail {
  const found = MOCK_TICKETS.find(
    (t) => t.key.toLowerCase() === ticketKey.toLowerCase() || t.id.toLowerCase() === ticketKey.toLowerCase()
  );

  const fallback = found || {
    id: `mock-${ticketKey}`,
    key: ticketKey,
    summary: `Request ${ticketKey}`,
    status: "In Progress",
    statusCategory: "indeterminate",
    statusCategoryName: "In Progress",
    type: "Service Request",
    clientName: "Metro Emergency Medical Services",
    organization: "Metro Emergency Medical Services",
    projectId: "4",
    projectName: "Information Technology",
    projectKey: "IT",
    priority: { name: "Medium" },
    reporter: {
      displayName: userName || "You (Employee)",
      emailAddress: userEmail || "employee@emsmc.com",
    },
    assignee: {
      displayName: "Sarah Jenkins",
      emailAddress: "sarah.jenkins@enterprise.com",
    },
    created: new Date(now - 2 * day).toISOString(),
    updated: new Date(now - 2 * hour).toISOString(),
  };

  const isResolved =
    fallback.statusCategory === "done" ||
    fallback.status.toLowerCase().includes("resolved") ||
    fallback.status.toLowerCase().includes("closed");

  return {
    id: fallback.id,
    key: fallback.key,
    summary: fallback.summary,
    status: fallback.status,
    statusCategory: fallback.statusCategory as "NEW" | "INDETERMINATE" | "DONE",
    type: fallback.type,
    clientName: fallback.clientName,
    organization: fallback.organization,
    created: fallback.created,
    updated: fallback.updated,
    priority: fallback.priority,
    projectKey: fallback.projectKey || "IT",
    projectName: fallback.projectName || "Information Technology",
    reporter: {
      displayName: fallback.reporter?.displayName || userName || "You (Employee)",
      emailAddress: fallback.reporter?.emailAddress || userEmail || "employee@emsmc.com",
    },
    assignee: fallback.assignee,
    resolution: fallback.resolution,
    statusHistory: [
      {
        status: "Waiting for support",
        statusCategory: "NEW",
        statusDate: fallback.created,
      },
      {
        status: "Under Review",
        statusCategory: "INDETERMINATE",
        statusDate: new Date(new Date(fallback.created || "").getTime() + 12 * hour).toISOString(),
      },
      ...(isResolved
        ? [
            {
              status: fallback.status,
              statusCategory: "DONE",
              statusDate: fallback.updated,
            },
          ]
        : [
            {
              status: fallback.status,
              statusCategory: "INDETERMINATE",
              statusDate: fallback.updated,
            },
          ]),
    ],
    comments: [
      {
        id: "c-1",
        author: {
          displayName: "IT Service Desk System",
          isAgent: true,
        },
        body: `Your request has been officially received and assigned to Tier 2 specialist ${fallback.assignee?.displayName || "Support Specialist"}.`,
        created: fallback.created || new Date().toISOString(),
        isPublic: true,
      },
      {
        id: "c-2",
        author: {
          displayName: fallback.assignee?.displayName || "Support Specialist",
          isAgent: true,
        },
        body: isResolved
          ? "We have verified the request resolution. All diagnostic checks and approvals have successfully concluded."
          : `Hello! We are actively reviewing this request (${fallback.summary}). We will update this thread as soon as the next checkpoint is reached.`,
        created: fallback.updated || new Date().toISOString(),
        isPublic: true,
      },
    ],
    backendUrl: `https://mock.atlassian.net/browse/${fallback.key}`,
    portalUrl: `https://mock.atlassian.net/servicedesk/customer/user/requests?issueKey=${fallback.key}`,
    isMock: true,
  };
}
