// types/jsm.ts

export interface Choice {
  id?: string;
  value?: string;
  label?: string;
  name?: string;
  children?: Choice[];
  parentId?: string;
  email?: string;
  avatarUrl?: string;
  accountId?: string;
}

export type JsmFieldType =
  | "text"
  | "paragraph"
  | "email"
  | "url"
  | "number"
  | "dropdown"
  | "radio"
  | "checkbox"
  | "cascading"
  | "user-picker"
  | "multi-user-picker"
  | "group-picker"
  | "multi-group-picker"
  | "labels"
  | "date"
  | "datetime-local"
  | "time"
  | "file"
  | "info"
  | "asset"
  | "components"
  | "priority"
  | string;

export interface JsmField {
  id: string;
  fieldId?: string;
  jiraField?: string;
  name?: string;
  label?: string;
  description?: string;
  required?: boolean;
  type?: JsmFieldType;
  choices?: Choice[];
  source?: "jira" | "proforma" | string;
  allowMultiple?: boolean;
  default?: unknown;
  value?: unknown;
}

export type FormField = JsmField;

export interface RequestType {
  id: string;
  name: string;
  description?: string;
  group?: string;
  groupIds?: string[];
  portalUrl?: string;
  serviceDeskId?: string;
  spaceName?: string;
  spaceKey?: string;
  hiddenFromPortal?: boolean;
}

export interface RequestTypeWithGroup extends RequestType {
  group?: string;
  spaceName?: string;
  spaceKey?: string;
  hiddenFromPortal?: boolean;
}

export interface SubmitPayload {
  serviceDeskId?: string;
  requestTypeId?: string;
  requestTypeName?: string;
  formId?: string | null;
  fieldValues: Record<string, unknown>;
  fields?: JsmField[];
  userEmail?: string;
}

export interface SubmitResponse {
  success: boolean;
  issueKey?: string;
  issueId?: string;
  error?: string;
  isMock?: boolean;
}

export interface JiraRequestTypeGroup {
  id: string;
  name: string;
}

export interface JiraRequestTypeItem {
  id: string | number;
  name: string;
  description?: string;
  helpText?: string;
  groupIds?: string[];
  portalId?: string | number;
  portalVisible?: boolean;
  hidden?: boolean;
  restrictionStatus?: string;
}

export interface ProformaQuestionItem {
  id?: string;
  label?: string;
  description?: string;
  type?: string;
  allowMultiple?: boolean;
  validation?: {
    required?: boolean;
    rq?: boolean;
  };
  choices?: Array<{
    id?: string | number;
    label?: string;
    value?: string;
    parentId?: string;
    children?: Array<{ id?: string | number; label?: string; value?: string }>;
  }>;
  jiraField?: string;
}

export interface ProformaLayoutItem {
  type?: string;
  questionId?: string;
  items?: ProformaLayoutItem[];
  columns?: Array<{ items?: ProformaLayoutItem[] }>;
}

export interface ProformaFormSummary {
  id: string | number;
  name?: string;
  requestTypeIds?: Array<string | number>;
  portalRequestTypeIds?: Array<string | number>;
  publish?: {
    portalRequestTypeIds?: Array<string | number>;
  };
  design?: {
    requestTypeIds?: Array<string | number>;
    settings?: {
      requestTypeIds?: Array<string | number>;
      portalRequestTypeIds?: Array<string | number>;
    };
    questions?: Record<string, ProformaQuestionItem>;
    layout?: ProformaLayoutItem[];
  };
}

export interface TicketPriority {
  name: string;
  iconUrl?: string;
}

export interface TicketUser {
  displayName?: string;
  emailAddress?: string;
  avatarUrl?: string;
}

export interface TicketItem {
  id: string;
  key: string;
  summary: string;
  status: string;
  statusCategory?: "NEW" | "INDETERMINATE" | "DONE" | "new" | "indeterminate" | "done" | string;
  statusCategoryName?: string;
  type: string;
  typeIconUrl?: string;
  clientName?: string | null;
  organization?: string | null;
  created: string | null;
  updated: string | null;
  projectId?: string | null;
  projectName?: string | null;
  projectKey?: string | null;
  priority?: TicketPriority;
  reporter?: TicketUser;
  assignee?: TicketUser;
  resolution?: {
    name?: string;
    date?: string;
  };
  portalUrl?: string;
  backendUrl?: string;
}

export interface TicketStatusItem {
  status: string;
  statusCategory?: "NEW" | "INDETERMINATE" | "DONE" | string;
  statusDate: string | null;
}

export interface TicketCommentItem {
  id: string;
  author: {
    displayName: string;
    emailAddress?: string;
    avatarUrl?: string;
    isAgent?: boolean;
  };
  body: string;
  created: string;
  isPublic?: boolean;
}

export interface TicketDetail {
  id: string;
  key: string;
  summary: string;
  status: string;
  statusCategory?: "NEW" | "INDETERMINATE" | "DONE" | string;
  type: string;
  clientName?: string | null;
  organization?: string | null;
  created: string | null;
  updated: string | null;
  priority?: TicketPriority;
  reporter?: {
    displayName?: string;
    emailAddress?: string;
    avatarUrl?: string;
  };
  assignee?: {
    displayName?: string;
    emailAddress?: string;
    avatarUrl?: string;
  };
  projectKey?: string;
  projectName?: string;
  resolution?: {
    name?: string;
    date?: string;
  };
  statusHistory: TicketStatusItem[];
  comments: TicketCommentItem[];
  serviceDeskId?: string;
  portalUrl?: string;
  backendUrl?: string;
  isMock?: boolean;
}

export interface JsmSpace {
  id: string;
  projectName: string;
  category?: string;
  [key: string]: unknown;
}

export interface KnowledgeBaseArticle {
  title?: string;
  excerpt?: string;
  portalUrl?: string;
  content?: {
    iframeSrc?: string;
  };
  [key: string]: unknown;
}
