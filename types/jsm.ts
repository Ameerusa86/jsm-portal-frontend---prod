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
}

export interface RequestTypeWithGroup extends RequestType {
  group?: string;
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
  created: string | null;
  updated: string | null;
  reporter?: {
    displayName?: string;
    emailAddress?: string;
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
