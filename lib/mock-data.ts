import { JsmField } from "@/types/jsm";

export interface MockUser {
  accountId: string;
  displayName: string;
  emailAddress: string;
  avatarUrl?: string;
  role?: string;
}

export interface MockGroup {
  groupId: string;
  name: string;
  description?: string;
}

export const MOCK_USERS: MockUser[] = [
  {
    accountId: "usr-1001",
    displayName: "Sarah Jenkins",
    emailAddress: "sarah.jenkins@enterprise.com",
    role: "Hardware & IT Operations Lead",
  },
  {
    accountId: "usr-1002",
    displayName: "Alex Morgan",
    emailAddress: "alex.morgan@enterprise.com",
    role: "Information Security Analyst",
  },
  {
    accountId: "usr-1003",
    displayName: "David Chen",
    emailAddress: "david.chen@enterprise.com",
    role: "Staff DevOps & Infrastructure Engineer",
  },
  {
    accountId: "usr-1004",
    displayName: "Emily Watson",
    emailAddress: "emily.watson@enterprise.com",
    role: "IT Service Desk Tier 2 Specialist",
  },
  {
    accountId: "usr-1005",
    displayName: "Michael Brown",
    emailAddress: "michael.brown@enterprise.com",
    role: "Engineering Director",
  },
  {
    accountId: "usr-1006",
    displayName: "Rachel Green",
    emailAddress: "rachel.green@enterprise.com",
    role: "Product Operations Manager",
  },
  {
    accountId: "usr-1007",
    displayName: "Ameer Hassan",
    emailAddress: "ameer.hassan@enterprise.com",
    role: "Senior Solutions Architect",
  },
];

export const MOCK_GROUPS: MockGroup[] = [
  {
    groupId: "grp-1",
    name: "jira-software-users",
    description: "Standard Jira & Confluence access",
  },
  {
    groupId: "grp-2",
    name: "it-support-tier2",
    description: "IT Service Desk Tier 2 escalation team",
  },
  {
    groupId: "grp-3",
    name: "cloud-infrastructure-admins",
    description: "AWS and GCP cloud root administrators",
  },
  {
    groupId: "grp-4",
    name: "engineering-core-team",
    description: "Core software engineering and dev team",
  },
  {
    groupId: "grp-5",
    name: "soc2-compliance-auditors",
    description: "Security and compliance audit personnel",
  },
];

export interface MockSpace {
  id: string;
  projectName: string;
  projectKey: string;
  category: string;
}

export const MOCK_SPACES: MockSpace[] = [
  {
    id: "4",
    projectName: "Information Technology",
    projectKey: "IT",
    category: "Information Technology",
  },
  {
    id: "2",
    projectName: "Billing & Revenue",
    projectKey: "BILL",
    category: "Finance & Accounting",
  },
  {
    id: "3",
    projectName: "Human Resources",
    projectKey: "HR",
    category: "People & Culture",
  },
  {
    id: "5",
    projectName: "Client Operations",
    projectKey: "OPS",
    category: "Customer Support",
  },
];

export interface MockRequestType {
  id: string;
  name: string;
  description: string;
  group: string;
  serviceDeskId?: string;
  portalUrl?: string;
  groupIds?: string[];
  hiddenFromPortal?: boolean;
  restricted?: boolean;
  isLocked?: boolean;
  canCreate?: boolean;
}

export const MOCK_REQUEST_TYPES: MockRequestType[] = [
  // --- INFORMATION TECHNOLOGY (Service Desk 4) ---
  {
    id: "199",
    name: "Internal Datacenter Decommission (Agent Only)",
    description: "Confidential infrastructure teardown run strictly by system admins. Hidden from customer portal.",
    group: "Problems",
    serviceDeskId: "4",
    groupIds: [],
    hiddenFromPortal: true,
  },
  {
    id: "100",
    name: "Get Help",
    description: "General IT service desk inquiry, hardware/software troubleshooting, or immediate technical support.",
    group: "Problems",
    serviceDeskId: "4",
  },
  {
    id: "101",
    name: "VPN & Remote Network Access",
    description: "Request VPN configuration, tunnel access, certificates, or troubleshoot home network connectivity issues.",
    group: "Work Orders",
    serviceDeskId: "4",
  },
  {
    id: "102",
    name: "Reset Password or Unlock MFA",
    description: "Unlock Okta/SSO accounts, reset enterprise passwords, or re-sync Authenticator and hardware security keys.",
    group: "Problems",
    serviceDeskId: "4",
  },
  {
    id: "103",
    name: "Request Software License or SaaS Tool",
    description: "Request developer tools, productivity licenses (e.g., GitHub, Slack, Figma, JetBrains, Microsoft 365).",
    group: "Work Orders",
    serviceDeskId: "4",
  },
  {
    id: "104",
    name: "Request New Laptop or Workstation",
    description: "Order high-performance developer laptops, standard office machines, monitors, or hardware upgrades.",
    group: "Work Orders",
    serviceDeskId: "4",
  },
  {
    id: "105",
    name: "Report an IT Outage or System Problem",
    description: "Report service degradation, broken internal tools, production incidents, or office network outages.",
    group: "Problems",
    serviceDeskId: "4",
  },
  {
    id: "106",
    name: "Broken Equipment / Hardware Repair",
    description: "Submit repairs for cracked screens, swollen batteries, faulty chargers, broken keyboards, or damaged peripherals.",
    group: "Problems",
    serviceDeskId: "4",
  },
  {
    id: "108",
    name: "AWS / Cloud Infrastructure Permissions",
    restricted: true,
    isLocked: true,
    canCreate: false,
    description: "Request IAM roles, BigQuery dataset access, Kubernetes cluster permissions, or Cloud Console access.",
    group: "Work Orders",
    serviceDeskId: "4",
  },
  {
    id: "109",
    name: "Office Badge & Building Access",
    description: "Request physical smart badge replacements, visitor passes, or access permissions for global office locations.",
    group: "Work Orders",
    serviceDeskId: "4",
  },
  {
    id: "110",
    name: "Automated Report or ETL Pipeline Request",
    description: "Request new automated reports, scheduled data pipelines, or executive dashboards.",
    group: "Automations and Reports",
    serviceDeskId: "4",
  },
  {
    id: "111",
    name: "Submit IT Enhancement or Feature Idea",
    description: "Share recommendations for technology workflow improvements and portal tools.",
    group: "Suggestions",
    serviceDeskId: "4",
  },

  // --- BILLING (Service Desk 2) ---
  {
    id: "200",
    name: "Get Help",
    description: "General billing support, client invoicing questions, account ledger inquiries, or payment assistance.",
    group: "Invoices & Payments",
    serviceDeskId: "2",
  },
  {
    id: "201",
    name: "AR reconciliation",
    description: "Request accounts receivable balance reconciliation, audit matching, and discrepancy investigation.",
    group: "Invoices & Payments",
    serviceDeskId: "2",
  },
  {
    id: "202",
    name: "Invoice Copy or Itemized Receipt Request",
    description: "Request historical invoice PDF copies, receipt proof, or billing statement exports.",
    group: "Invoices & Payments",
    serviceDeskId: "2",
  },
  {
    id: "203",
    name: "Payment Remittance & Wire Confirmation",
    description: "Submit wire transfer documentation or confirm receipt of client ACH payments.",
    group: "Invoices & Payments",
    serviceDeskId: "2",
  },
  {
    id: "204",
    name: "Update Billing Address & Tax ID (W-9)",
    description: "Update client invoicing details, billing contacts, and submit tax exemption forms.",
    group: "Account Management",
    serviceDeskId: "2",
  },
  {
    id: "205",
    name: "Customer Account Ledger Audit",
    description: "Request a detailed customer account review, ledger reconciliation, and credit status check.",
    group: "Account Management",
    serviceDeskId: "2",
  },
  {
    id: "206",
    name: "Billing Dispute or Credit Memo Request",
    description: "Dispute invoice line items, request credit memos, or contest late payment fees.",
    group: "Refunds & Adjustments",
    serviceDeskId: "2",
  },
  {
    id: "207",
    name: "Overpayment Refund Request",
    description: "Request refund issuance for duplicate payments or positive customer credit balances.",
    group: "Refunds & Adjustments",
    serviceDeskId: "2",
  },

  // --- HUMAN RESOURCES (Service Desk 3) ---
  {
    id: "300",
    name: "Get Help",
    description: "General HR assistance, policy inquiries, benefits counseling, or employee relations support.",
    group: "Benefits & Leave",
    serviceDeskId: "3",
  },
  {
    id: "107",
    name: "New Employee / Contractor Onboarding",
    description: "Provision hardware, accounts, email, permissions, and security badges for incoming team members.",
    group: "Onboarding & Hiring",
    serviceDeskId: "3",
  },
  {
    id: "302",
    name: "Contractor Extension Request",
    description: "Extend placement duration and contract terms for temporary personnel and vendors.",
    group: "Onboarding & Hiring",
    serviceDeskId: "3",
  },
  {
    id: "303",
    name: "Health Insurance & Benefits Inquiry",
    description: "Questions regarding company health coverage, dental, vision, HSA, and 401(k) benefits.",
    group: "Benefits & Leave",
    serviceDeskId: "3",
  },
  {
    id: "304",
    name: "Parental or Medical Leave Request",
    description: "Apply for FMLA leave, parental bonding, or medical absence accommodations.",
    group: "Benefits & Leave",
    serviceDeskId: "3",
  },
  {
    id: "305",
    name: "Employment Verification Letter",
    description: "Request official employment and income verification letters for loans and visas.",
    group: "General HR",
    serviceDeskId: "3",
  },
  {
    id: "306",
    name: "Direct Deposit & Payroll Details Update",
    description: "Update bank routing numbers, direct deposit split, or state tax withholding elections.",
    group: "General HR",
    serviceDeskId: "3",
  },

  // --- CLIENT OPERATIONS (Service Desk 5) ---
  {
    id: "501",
    name: "Client Account Escalation",
    description: "Escalate critical customer service issues or severe client dissatisfaction cases.",
    group: "Client Inquiries",
    serviceDeskId: "5",
  },
  {
    id: "502",
    name: "Service Level Agreement (SLA) Review",
    description: "Request contractual SLA audit, uptime verification, and compliance reports.",
    group: "Client Inquiries",
    serviceDeskId: "5",
  },
  {
    id: "503",
    name: "Client Portal Access Issue",
    description: "Troubleshoot external customer login, password reset, or permissions in the client portal.",
    group: "Technical Assistance",
    serviceDeskId: "5",
  },
  {
    id: "504",
    name: "Data Feed & API Integration Support",
    description: "Resolve client webhook issues, automated SFTP drops, or API connectivity failures.",
    group: "Technical Assistance",
    serviceDeskId: "5",
  },
];

export const MOCK_FIELDS_BY_REQUEST_TYPE: Record<
  string,
  { formId?: string; fields: JsmField[] }
> = {
  // 101: VPN & Remote Network Access
  "101": {
    formId: "mock-form-101",
    fields: [
      {
        id: "summary",
        name: "Summary",
        description: "Brief summary of your VPN or network connection request",
        required: true,
        type: "text",
        source: "jira",
      },
      {
        id: "vpn_gateway",
        name: "Target Gateway / Region",
        description: "Select the VPN datacenter gateway closest to your physical location",
        required: true,
        type: "dropdown",
        choices: [
          { id: "us-east", label: "US East (New York / N. Virginia)" },
          { id: "us-west", label: "US West (Oregon / California)" },
          { id: "eu-central", label: "Europe (Frankfurt / London)" },
          { id: "ap-southeast", label: "Asia Pacific (Singapore / Sydney)" },
        ],
        source: "proforma",
      },
      {
        id: "os_platform",
        name: "Device Operating System",
        description: "What OS is running on the client machine?",
        required: true,
        type: "radio",
        choices: [
          { id: "macos", label: "macOS (Apple Silicon / Intel)" },
          { id: "windows", label: "Windows 11 / 10 Enterprise" },
          { id: "linux", label: "Linux (Ubuntu / Fedora / Debian)" },
        ],
        source: "proforma",
      },
      {
        id: "access_type",
        name: "Access Privileges Required",
        description: "Select which protected subnets or internal VPCs you need access to",
        required: true,
        type: "checkbox",
        choices: [
          { id: "staging_vpc", label: "Staging & Pre-Production VPC" },
          { id: "prod_vpc", label: "Production VPC (Requires Manager Approval)" },
          { id: "corp_intranet", label: "Corporate Intranet & Jira / Confluence" },
          { id: "db_cluster", label: "Internal Databases & Analytics Warehouses" },
        ],
        source: "proforma",
      },
      {
        id: "business_justification",
        name: "Business Justification",
        description: "Explain why this access is required and list project name or manager approval",
        required: true,
        type: "paragraph",
        source: "proforma",
      },
      {
        id: "attachment",
        name: "Diagnostics / Network Logs (Optional)",
        description: "Attach connection error screenshots or ping/traceroute logs",
        required: false,
        type: "file",
        source: "jira",
      },
    ],
  },

  // 102: Reset Password or Unlock MFA
  "102": {
    formId: "mock-form-102",
    fields: [
      {
        id: "summary",
        name: "Account Summary",
        description: "Short title of the account lockout or authentication issue",
        required: true,
        type: "text",
        source: "jira",
      },
      {
        id: "account_type",
        name: "Service / Account Affected",
        description: "Select the system you cannot log into",
        required: true,
        type: "dropdown",
        choices: [
          { id: "okta_sso", label: "Okta Corporate SSO / Google Workspace" },
          { id: "active_directory", label: "Active Directory / Laptop Login" },
          { id: "vpn_credentials", label: "GlobalProtect / OpenVPN" },
          { id: "github_mfa", label: "GitHub Enterprise 2FA" },
        ],
        source: "proforma",
      },
      {
        id: "issue_nature",
        name: "Issue Type",
        description: "What specifically is blocking your authentication?",
        required: true,
        type: "radio",
        choices: [
          { id: "lost_phone", label: "Lost or replaced phone (MFA re-enrollment)" },
          { id: "locked_out", label: "Account locked after too many attempts" },
          { id: "expired_pwd", label: "Password expired and cannot reset via portal" },
          { id: "hardware_key", label: "YubiKey / Security Key not recognized" },
        ],
        source: "proforma",
      },
      {
        id: "recovery_phone",
        name: "Callback Phone Number or Alternate Email",
        description: "For identity verification and voice confirmation before reset",
        required: true,
        type: "text",
        source: "proforma",
      },
      {
        id: "manager_email",
        name: "Direct Manager's Email",
        description: "Manager will receive a confirmation ping for security verification",
        required: true,
        type: "text",
        source: "proforma",
      },
    ],
  },

  // 103: Request Software License
  "103": {
    formId: "mock-form-103",
    fields: [
      {
        id: "summary",
        name: "Software Request Title",
        required: true,
        type: "text",
        source: "jira",
      },
      {
        id: "software_name",
        name: "Requested Application / License",
        description: "Choose from pre-approved enterprise catalog",
        required: true,
        type: "dropdown",
        choices: [
          { id: "github_copilot", label: "GitHub Copilot Enterprise" },
          { id: "jetbrains_all", label: "JetBrains All Products Pack (IntelliJ, WebStorm, PyCharm)" },
          { id: "figma_editor", label: "Figma Professional / Enterprise Editor" },
          { id: "postman_team", label: "Postman Team Workspace" },
          { id: "tableau_creator", label: "Tableau Creator License" },
          { id: "datadog_admin", label: "Datadog / APM Read-Write Access" },
          { id: "other_software", label: "Other (Specify in notes below)" },
        ],
        source: "proforma",
      },
      {
        id: "cost_center",
        name: "Department & Cost Center",
        required: true,
        type: "dropdown",
        choices: [
          { id: "eng", label: "Engineering & Architecture (CC-4100)" },
          { id: "prod", label: "Product & Design (CC-4200)" },
          { id: "data", label: "Data Science & Analytics (CC-4300)" },
          { id: "sec", label: "Information Security & SecOps (CC-4400)" },
          { id: "ops", label: "Business Operations (CC-4500)" },
        ],
        source: "proforma",
      },
      {
        id: "justification",
        name: "Usage & Project Justification",
        description: "Detail how this software accelerates your ongoing work and roadmap commitments",
        required: true,
        type: "paragraph",
        source: "proforma",
      },
    ],
  },

  // 104: Request New Laptop or Workstation
  "104": {
    formId: "mock-form-104",
    fields: [
      {
        id: "summary",
        name: "Hardware Request Summary",
        required: true,
        type: "text",
        source: "jira",
      },
      {
        id: "hardware_model",
        name: "Selected Hardware Model",
        description: "Choose your primary compute machine configuration",
        required: true,
        type: "radio",
        choices: [
          { id: "mac_m3_max", label: "Apple MacBook Pro 16\" (M3 Max, 64GB RAM, 1TB SSD) - Developer Tier" },
          { id: "mac_m3_pro", label: "Apple MacBook Pro 14\" (M3 Pro, 36GB RAM, 512GB SSD) - Standard Tier" },
          { id: "dell_xps", label: "Dell XPS 15 (Intel Core i9, 32GB RAM, RTX 4070, Windows 11)" },
          { id: "lenovo_thinkpad", label: "Lenovo ThinkPad X1 Carbon Gen 12 (Intel Ultra 7, 32GB RAM)" },
        ],
        source: "proforma",
      },
      {
        id: "peripherals",
        name: "Accessories & Peripherals",
        description: "Select any additional workplace peripherals you need",
        required: false,
        type: "checkbox",
        choices: [
          { id: "monitor_4k", label: "Dell UltraSharp 27\" 4K USB-C Hub Monitor" },
          { id: "keyboard_mouse", label: "Logitech MX Master 3S Mouse + MX Keys Combo" },
          { id: "caldigit_dock", label: "CalDigit TS4 Thunderbolt 4 Docking Station" },
          { id: "bose_headset", label: "Jabra Evolve2 75 Wireless Noise-Cancelling Headset" },
        ],
        source: "proforma",
      },
      {
        id: "shipping_address",
        name: "Shipping Address / Office Desk Number",
        description: "Full residential address for remote employees or office desk coordinates",
        required: true,
        type: "paragraph",
        source: "proforma",
      },
      {
        id: "target_date",
        name: "Required By Date",
        required: false,
        type: "date",
        source: "proforma",
      },
    ],
  },

  // 105: Report an IT Outage
  "105": {
    formId: "mock-form-105",
    fields: [
      {
        id: "summary",
        name: "Incident Summary",
        description: "State the affected service and primary symptom (e.g., 'Internal CI/CD Pipeline Failing')",
        required: true,
        type: "text",
        source: "jira",
      },
      {
        id: "urgency_level",
        name: "Impact & Urgency",
        description: "How widely is this issue affecting the organization?",
        required: true,
        type: "radio",
        choices: [
          { id: "p1", label: "🔴 Critical (P1) - Total company/customer outage or severe revenue blockage" },
          { id: "p2", label: "🟠 High (P2) - Whole department or core business process blocked" },
          { id: "p3", label: "🟡 Medium (P3) - Multiple users affected, workaround exists" },
          { id: "p4", label: "🔵 Low (P4) - Single user minor glitch or cosmetic issue" },
        ],
        source: "proforma",
      },
      {
        id: "affected_systems",
        name: "Affected Systems",
        required: true,
        type: "dropdown",
        choices: [
          { id: "github_actions", label: "GitHub Enterprise / CI/CD Runners" },
          { id: "jira_confluence", label: "Jira / Confluence Cloud" },
          { id: "slack_comm", label: "Slack / Email / Zoom Communications" },
          { id: "k8s_clusters", label: "Kubernetes Production Clusters" },
          { id: "office_lan", label: "Office Wi-Fi / Local Network Switches" },
          { id: "other", label: "Other Internal System" },
        ],
        source: "proforma",
      },
      {
        id: "description",
        name: "Detailed Description & Steps to Reproduce",
        description: "Include timestamps, URLs, exact error messages, and what steps lead to the failure",
        required: true,
        type: "paragraph",
        source: "jira",
      },
      {
        id: "attachment",
        name: "Screenshots & Error Logs",
        required: false,
        type: "file",
        source: "jira",
      },
    ],
  },
  // 106: Broken Equipment / Hardware Repair
  "106": {
    formId: "mock-form-106",
    fields: [
      {
        id: "summary",
        name: "Hardware Issue Summary",
        description: "State the device type and failure symptom (e.g., 'MacBook Pro Screen Flicker')",
        required: true,
        type: "text",
        source: "jira",
      },
      {
        id: "equipment_category",
        name: "Equipment Category & Sub-type",
        description: "Select device classification and specific model category",
        required: true,
        type: "cascading",
        choices: [
          {
            id: "laptops",
            label: "Laptop & Workstation",
            children: [
              { id: "macbook_pro_16", label: "MacBook Pro 16\" (M-Series)" },
              { id: "macbook_pro_14", label: "MacBook Pro 14\" (M-Series)" },
              { id: "dell_precision", label: "Dell Precision / XPS" },
              { id: "thinkpad_x1", label: "Lenovo ThinkPad X1" },
            ],
          },
          {
            id: "displays",
            label: "Monitors & Displays",
            children: [
              { id: "dell_ultrasharp", label: "Dell UltraSharp 27\" / 32\" 4K" },
              { id: "apple_studio", label: "Apple Studio Display 27\" 5K" },
              { id: "lg_ultrafine", label: "LG UltraFine Monitor" },
            ],
          },
          {
            id: "peripherals",
            label: "Peripherals & Docks",
            children: [
              { id: "thunderbolt_dock", label: "Thunderbolt 4 Docking Station" },
              { id: "mx_keys_mouse", label: "Wireless Keyboard / Mouse" },
              { id: "power_adapter", label: "USB-C MagSafe Charger / Power Brick" },
            ],
          },
        ],
        source: "proforma",
      },
      {
        id: "asset_tag",
        name: "Corporate Asset Tag # (Insight Asset)",
        description: "Found on the barcode sticker on bottom of machine (e.g., AST-90281)",
        required: true,
        type: "asset",
        source: "proforma",
      },
      {
        id: "incident_date",
        name: "Date Issue First Occurred",
        required: true,
        type: "date",
        source: "proforma",
      },
      {
        id: "damage_severity",
        name: "Damage / Failure Severity",
        required: true,
        type: "radio",
        choices: [
          { id: "inoperable", label: "🔴 Completely Inoperable (Cannot boot / Total outage)" },
          { id: "degraded", label: "🟡 Partially Functional (Workaround possible)" },
          { id: "cosmetic", label: "🟢 Minor Cosmetic / Accessory Damage" },
        ],
        source: "proforma",
      },
      {
        id: "description",
        name: "Detailed Diagnostic Symptoms",
        description: "Describe what happened, any liquid contact, error codes, or physical damage",
        required: true,
        type: "paragraph",
        source: "jira",
      },
      {
        id: "attachment",
        name: "Photos of Damage or Error Screen",
        description: "Upload clear photos showing the damaged component or diagnostic screen",
        required: false,
        type: "file",
        source: "jira",
      },
    ],
  },

  // 107: New Employee / Contractor Onboarding
  "107": {
    formId: "mock-form-107",
    fields: [
      {
        id: "summary",
        name: "Onboarding Request Title",
        description: "e.g. 'Onboard Sarah Jenkins - Senior Software Engineer'",
        required: true,
        type: "text",
        source: "jira",
      },
      {
        id: "hiring_manager",
        name: "Hiring Manager / Supervisor",
        description: "Search and select the direct supervisor responsible for approvals",
        required: true,
        type: "user-picker",
        source: "proforma",
      },
      {
        id: "peer_buddies",
        name: "Assigned Peer Onboarding Buddies",
        description: "Select one or more team members to assist with orientation & pairing",
        required: false,
        type: "multi-user-picker",
        source: "proforma",
      },
      {
        id: "primary_security_group",
        name: "Primary IAM / Security Group",
        description: "Default department group for access provisioning",
        required: true,
        type: "group-picker",
        source: "proforma",
      },
      {
        id: "department_hierarchy",
        name: "Department & Organizational Unit",
        description: "Select division and specific sub-team",
        required: true,
        type: "cascading",
        choices: [
          {
            id: "engineering",
            label: "Engineering & Architecture",
            children: [
              { id: "frontend_core", label: "Frontend Platforms & UX Core" },
              { id: "backend_services", label: "Backend Microservices & APIs" },
              { id: "infra_devops", label: "Infrastructure, SRE & Cloud DevOps" },
              { id: "data_engineering", label: "Data Platform & Warehousing" },
            ],
          },
          {
            id: "product_design",
            label: "Product & UX Design",
            children: [
              { id: "core_product", label: "Core Enterprise Product" },
              { id: "design_systems", label: "Design Systems & UI Engineering" },
              { id: "product_ops", label: "Product Analytics & Operations" },
            ],
          },
          {
            id: "security_compliance",
            label: "Security & Trust",
            children: [
              { id: "secops", label: "Security Operations & Incident Response" },
              { id: "appsec", label: "Application Security & Pen Testing" },
              { id: "grc", label: "Governance, Risk & SOC2 Compliance" },
            ],
          },
        ],
        source: "proforma",
      },
      {
        id: "start_date",
        name: "Official First Day / Start Date",
        description: "Accounts and hardware provisioning will be ready 48h prior",
        required: true,
        type: "date",
        source: "proforma",
      },
      {
        id: "corporate_email",
        name: "Preferred Corporate Email Address",
        description: "e.g. first.last@enterprise.com",
        required: true,
        type: "email",
        source: "proforma",
      },
      {
        id: "employment_type",
        name: "Employment Classification",
        required: true,
        type: "radio",
        choices: [
          { id: "full_time", label: "Full-Time Employee (FTE)" },
          { id: "contractor", label: "Contractor / Vendor" },
          { id: "intern", label: "University Intern / Co-op" },
        ],
        source: "proforma",
      },
      {
        id: "special_instructions",
        name: "Special Hardware & Software Requirements",
        description: "List custom dev packages, hardware upgrades, or building access notes",
        required: false,
        type: "paragraph",
        source: "proforma",
      },
    ],
  },

  // 108: AWS / Cloud Infrastructure Permissions
  "108": {
    formId: "mock-form-108",
    fields: [
      {
        id: "summary",
        name: "Cloud Permission Request Summary",
        description: "Brief summary (e.g., 'IAM BigQuery Data Admin Access for Production Analytics')",
        required: true,
        type: "text",
        source: "jira",
      },
      {
        id: "target_engineer",
        name: "Beneficiary User (Who needs access?)",
        description: "Search and select the user receiving IAM privileges",
        required: true,
        type: "user-picker",
        source: "proforma",
      },
      {
        id: "approving_leads",
        name: "Approving Engineering Leads",
        description: "Select lead engineers or security architects authorizing this role",
        required: true,
        type: "multi-user-picker",
        source: "proforma",
      },
      {
        id: "iam_group_role",
        name: "Target IAM Group",
        description: "Choose cloud IAM group configuration",
        required: true,
        type: "group-picker",
        source: "proforma",
      },
      {
        id: "cloud_environment",
        name: "Cloud Provider & Tier",
        description: "Select cloud provider and target environment tier",
        required: true,
        type: "cascading",
        choices: [
          {
            id: "aws",
            label: "Amazon Web Services (AWS)",
            children: [
              { id: "aws_prod", label: "Production Accounts (1019-PROD)" },
              { id: "aws_staging", label: "Staging / Pre-prod (1020-STAGE)" },
              { id: "aws_dev", label: "Sandbox & Dev Accounts (1021-DEV)" },
            ],
          },
          {
            id: "gcp",
            label: "Google Cloud Platform (GCP)",
            children: [
              { id: "gcp_prod_bq", label: "Production BigQuery & ML Pipelines" },
              { id: "gcp_staging_gke", label: "Staging GKE Kubernetes Clusters" },
              { id: "gcp_dev_analytics", label: "Dev Analytics & Dataform" },
            ],
          },
        ],
        source: "proforma",
      },
      {
        id: "privileges",
        name: "Specific Privileges Required",
        required: true,
        type: "checkbox",
        choices: [
          { id: "read_only", label: "View & Read Only (CloudWatch, S3, IAM list)" },
          { id: "db_admin", label: "Database Read-Write (Spanner / RDS / BigQuery)" },
          { id: "k8s_deploy", label: "Kubernetes Cluster Deployment & Rollout" },
          { id: "kms_crypto", label: "KMS Key Decrypt & Secret Manager Access" },
        ],
        source: "proforma",
      },
      {
        id: "repository_url",
        name: "Associated GitHub / GitLab Repository URL",
        description: "Link to the code repository or infrastructure Terraform repo",
        required: false,
        type: "url",
        source: "proforma",
      },
      {
        id: "tags_labels",
        name: "Compliance Tags & Resource Labels",
        description: "Add tags e.g. soc2, audit, pci-dss, analytics",
        required: false,
        type: "labels",
        choices: [
          { id: "soc2", label: "soc2" },
          { id: "pci-dss", label: "pci-dss" },
          { id: "analytics", label: "analytics" },
          { id: "infrastructure", label: "infrastructure" },
        ],
        source: "jira",
      },
      {
        id: "expiry_date",
        name: "Access Expiration Date (Temporary Privileges)",
        description: "Privileges automatically revoke after this date per zero-trust policy",
        required: false,
        type: "date",
        source: "proforma",
      },
      {
        id: "justification",
        name: "Security Justification & Ticket Reference",
        required: true,
        type: "paragraph",
        source: "proforma",
      },
    ],
  },

  // 109: Office Badge & Building Access
  "109": {
    formId: "mock-form-109",
    fields: [
      {
        id: "summary",
        name: "Badge Request Summary",
        required: true,
        type: "text",
        source: "jira",
      },
      {
        id: "badge_holder",
        name: "Cardholder / Employee",
        description: "Select the employee receiving the badge",
        required: true,
        type: "user-picker",
        source: "proforma",
      },
      {
        id: "office_site",
        name: "Target Office Facility",
        required: true,
        type: "dropdown",
        choices: [
          { id: "hq_austin", label: "Austin HQ (Building A & B)" },
          { id: "ny_office", label: "New York Hub (Manhattan 5th Ave)" },
          { id: "sf_office", label: "San Francisco Tech Center (Market St)" },
          { id: "london_office", label: "London EMEA Headquarters (Soho)" },
        ],
        source: "proforma",
      },
      {
        id: "secure_zones",
        name: "Special Restricted Zone Access",
        required: false,
        type: "checkbox",
        choices: [
          { id: "datacenter", label: "On-Premises Server Room / Datacenter" },
          { id: "hardware_lab", label: "Hardware Diagnostics & Repair Lab" },
          { id: "executive_floor", label: "Executive Boardroom & High Security Suite" },
          { id: "parking_garage", label: "Secure Underground Parking Deck" },
        ],
        source: "proforma",
      },
      {
        id: "effective_start",
        name: "Effective Start Date",
        required: true,
        type: "date",
        source: "proforma",
      },
    ],
  },
};

// Generic fallback fields for any other request type
export const DEFAULT_MOCK_FIELDS: JsmField[] = [
  {
    id: "summary",
    name: "Request Title",
    description: "Provide a descriptive title for your request",
    required: true,
    type: "text",
    source: "jira",
  },
  {
    id: "urgency",
    name: "Priority Level",
    required: true,
    type: "dropdown",
    choices: [
      { id: "low", label: "Low - Standard SLA" },
      { id: "medium", label: "Medium - Within 24h" },
      { id: "high", label: "High - Urgent Attention" },
    ],
    source: "proforma",
  },
  {
    id: "description",
    name: "Details & Requirements",
    description: "Please provide all details, specifications, and requirements",
    required: true,
    type: "paragraph",
    source: "jira",
  },
  {
    id: "attachment",
    name: "Supporting Documents / Attachments",
    required: false,
    type: "file",
    source: "jira",
  },
];
