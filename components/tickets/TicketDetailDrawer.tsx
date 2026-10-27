"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Send,
  MessageSquare,
  AlertCircle,
  AlertTriangle,
  Ban,
  Clock,
  Loader2,
  XCircle,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { TicketDetail } from "@/types/jsm";
import {
  StatusBadge,
  PriorityChip,
  ClientBadge,
  formatRelativeTime,
  formatFullDate,
  getStatusStyle,
} from "./TicketBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TicketDetailDrawerProps {
  ticketKey: string | null;
  onClose: () => void;
  onTicketUpdated?: (updatedKey: string, newStatus: string) => void;
}

interface WorkflowStep {
  id: string;
  label: string;
  state: "completed" | "current" | "upcoming" | "canceled";
  date?: string | null;
  description?: string;
  isTerminal?: boolean;
}

function formatShortDate(isoDate?: string | null): string {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Dynamically constructs the workflow milestones based on actual Jira history,
 * current status, and resolution without hardcoding static steps.
 */
function buildDynamicWorkflowSteps(detail: TicketDetail): WorkflowStep[] {
  const currentStatusRaw = detail.status || "Submitted";
  const currentStatus = currentStatusRaw.trim();
  const lowerStatus = currentStatus.toLowerCase();
  const cat = (detail.statusCategory || "").toLowerCase();

  const isCanceled =
    cat === "canceled" ||
    lowerStatus.includes("cancel") ||
    lowerStatus.includes("withdraw") ||
    (detail.resolution?.name || "").toLowerCase().includes("cancel");

  const isCancellationRequested =
    lowerStatus.includes("cancellation requested");

  const isResolved =
    !isCanceled &&
    (cat === "done" ||
      lowerStatus.includes("resolved") ||
      lowerStatus.includes("closed") ||
      lowerStatus.includes("completed") ||
      lowerStatus.includes("done"));

  // Check if we have real historical transitions from Jira Service Management API
  const history = Array.isArray(detail.statusHistory) ? detail.statusHistory : [];

  // Filter and deduplicate history
  const uniqueHistory: { status: string; date: string | null; cat?: string }[] = [];
  const seenStatuses = new Set<string>();

  for (const h of history) {
    if (!h.status) continue;
    const norm = h.status.toLowerCase().trim();
    if (!seenStatuses.has(norm)) {
      seenStatuses.add(norm);
      uniqueHistory.push({
        status: h.status,
        date: h.statusDate,
        cat: (h.statusCategory || "").toLowerCase(),
      });
    }
  }

  // When live history has multiple distinct entries
  if (uniqueHistory.length >= 2) {
    const steps: WorkflowStep[] = uniqueHistory.map((item, idx) => {
      const isLast = idx === uniqueHistory.length - 1;
      const itemLower = item.status.toLowerCase();
      const itemIsCanceled =
        itemLower.includes("cancel") || itemLower.includes("withdraw");

      let state: "completed" | "current" | "upcoming" | "canceled" = "completed";

      if (itemIsCanceled) {
        state = "canceled";
      } else if (isLast) {
        if (isResolved) {
          state = "completed";
        } else if (isCanceled) {
          state = "canceled";
        } else {
          state = "current";
        }
      } else {
        state = "completed";
      }

      return {
        id: `step-${idx}-${item.status}`,
        label: item.status,
        state,
        date: item.date,
        isTerminal: isLast && (isResolved || isCanceled),
      };
    });

    const lastStep = steps[steps.length - 1];
    if (isCanceled && lastStep.state !== "canceled") {
      steps.push({
        id: "step-canceled",
        label: currentStatus.includes("Withdraw") ? "Withdrawn" : "Canceled",
        state: "canceled",
        date: detail.updated || new Date().toISOString(),
        isTerminal: true,
      });
    } else if (
      isResolved &&
      !/resolved|closed|done|completed/i.test(lastStep.label)
    ) {
      steps.push({
        id: "step-resolved",
        label: detail.status || "Resolved",
        state: "completed",
        date: detail.resolution?.date || detail.updated,
        isTerminal: true,
      });
    }

    return steps;
  }

  // --- Dynamic synthesis when history is minimal ---
  const steps: WorkflowStep[] = [];

  // Step 1: Submission / Creation
  steps.push({
    id: "step-submitted",
    label: "Submitted",
    state: "completed",
    date: detail.created,
  });

  // Scenario: Canceled
  if (isCanceled) {
    steps.push({
      id: "step-progress",
      label: "In Progress",
      state: "completed",
      date: detail.created ? detail.created : null,
    });
    steps.push({
      id: "step-canceled",
      label: currentStatus.includes("Withdraw") ? "Withdrawn" : "Canceled",
      state: "canceled",
      date: detail.updated,
      isTerminal: true,
    });
    return steps;
  }

  // Scenario: Cancellation Requested
  if (isCancellationRequested) {
    steps.push({
      id: "step-progress",
      label: "In Progress",
      state: "completed",
    });
    steps.push({
      id: "step-cancel-req",
      label: "Cancellation Requested",
      state: "current",
      date: detail.updated,
    });
    steps.push({
      id: "step-terminal",
      label: "Pending Closure",
      state: "upcoming",
      isTerminal: true,
    });
    return steps;
  }

  // Scenario: Resolved / Closed
  if (isResolved) {
    steps.push({
      id: "step-review",
      label: "Reviewed",
      state: "completed",
    });
    steps.push({
      id: "step-progress",
      label: "In Progress",
      state: "completed",
    });
    steps.push({
      id: "step-resolved",
      label: currentStatus || "Resolved",
      state: "completed",
      date: detail.resolution?.date || detail.updated,
      isTerminal: true,
    });
    return steps;
  }

  // Scenario: Waiting for Customer / Need Info
  if (
    lowerStatus.includes("customer") ||
    lowerStatus.includes("pending customer") ||
    lowerStatus.includes("waiting for you") ||
    lowerStatus.includes("need info")
  ) {
    steps.push({
      id: "step-review",
      label: "Under Review",
      state: "completed",
    });
    steps.push({
      id: "step-waiting-customer",
      label: currentStatus,
      state: "current",
      date: detail.updated,
      description: "Awaiting customer response",
    });
    steps.push({
      id: "step-resolution",
      label: "Resolution",
      state: "upcoming",
      isTerminal: true,
    });
    return steps;
  }

  // Scenario: Waiting for Manager / Approval
  if (
    lowerStatus.includes("approval") ||
    lowerStatus.includes("manager") ||
    lowerStatus.includes("pending approval")
  ) {
    steps.push({
      id: "step-approval",
      label: currentStatus,
      state: "current",
      date: detail.updated,
      description: "Awaiting manager approval",
    });
    steps.push({
      id: "step-fulfillment",
      label: "Fulfillment",
      state: "upcoming",
    });
    steps.push({
      id: "step-resolution",
      label: "Resolution",
      state: "upcoming",
      isTerminal: true,
    });
    return steps;
  }

  // Scenario: Newly Submitted / Waiting for Support
  if (
    lowerStatus.includes("open") ||
    lowerStatus.includes("to do") ||
    lowerStatus.includes("submitted") ||
    lowerStatus.includes("waiting for support")
  ) {
    steps[0].state = "current";
    steps[0].label = currentStatus;
    steps.push({
      id: "step-review",
      label: "Triage & Review",
      state: "upcoming",
    });
    steps.push({
      id: "step-progress",
      label: "In Progress",
      state: "upcoming",
    });
    steps.push({
      id: "step-resolution",
      label: "Resolution",
      state: "upcoming",
      isTerminal: true,
    });
    return steps;
  }

  // Scenario: Default Active State (In Progress / Investigating / Assigned)
  steps.push({
    id: "step-review",
    label: "Under Review",
    state: "completed",
  });
  steps.push({
    id: "step-current",
    label: currentStatus,
    state: "current",
    date: detail.updated,
  });
  steps.push({
    id: "step-resolution",
    label: "Resolution",
    state: "upcoming",
    isTerminal: true,
  });

  return steps;
}

export const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({
  ticketKey,
  onClose,
  onTicketUpdated,
}) => {
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comment state
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Cancellation state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (ticketKey) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [ticketKey]);

  // Fetch ticket details
  useEffect(() => {
    if (!ticketKey) return;

    let ignore = false;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      setShowCancelConfirm(false);
      setCancelError(null);

      try {
        const res = await fetch(
          `/api/jsm/tickets/${encodeURIComponent(ticketKey)}`
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error || `Error ${res.status}: ${res.statusText}`
          );
        }
        const data: TicketDetail = await res.json();
        if (!ignore) setDetail(data);
      } catch (err: unknown) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "Failed to load request details"
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    void fetchDetail();

    return () => {
      ignore = true;
    };
  }, [ticketKey]);

  const handleCopyKey = () => {
    if (!detail?.key) return;
    navigator.clipboard.writeText(detail.key);
    setCopiedKey(true);
    toast.success("Ticket ID Copied", {
      description: `${detail.key} copied to clipboard.`,
      duration: 3000,
    });
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyLink = () => {
    if (!detail?.key) return;
    const url =
      detail.portalUrl ||
      `${window.location.origin}/my-tickets/${encodeURIComponent(detail.key)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Link Copied", {
      description: "Direct request link copied to clipboard.",
      duration: 3000,
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketKey || !newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    setCommentError(null);

    try {
      const res = await fetch(
        `/api/jsm/tickets/${encodeURIComponent(ticketKey)}/comment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: newComment.trim() }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to post comment");
      }

      if (data.comment && detail) {
        setDetail({
          ...detail,
          comments: [...(detail.comments || []), data.comment],
        });
        setNewComment("");
        toast.success("Reply Posted", {
          description: "Your message has been added to the ticket.",
          duration: 3000,
        });
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error posting comment";
      setCommentError(msg);
      toast.error("Could Not Post Reply", {
        description: msg,
        duration: 5000,
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCancelTicket = async () => {
    if (!ticketKey || cancelling) return;
    setCancelling(true);
    setCancelError(null);

    try {
      const res = await fetch(
        `/api/jsm/tickets/${encodeURIComponent(ticketKey)}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel request");
      }

      const newStatus = data.status || "Canceled";

      if (detail) {
        const updatedComments = data.cancellationRequested
          ? [
              ...(detail.comments || []),
              {
                id: `cancel-${Date.now()}`,
                author: {
                  displayName: "You (Reporter)",
                  isAgent: false,
                },
                body: "⚠️ [Cancellation Request] The reporter has requested to cancel this request as it is no longer needed.",
                created: new Date().toISOString(),
                isPublic: true,
              },
            ]
          : detail.comments;

        setDetail({
          ...detail,
          status: newStatus,
          statusCategory: "CANCELED",
          comments: updatedComments,
          updated: new Date().toISOString(),
        });
      }

      setShowCancelConfirm(false);

      if (data.cancellationRequested) {
        toast.info("Cancellation Requested", {
          description: `Cancellation request for ${ticketKey} has been recorded and forwarded to the support team.`,
          duration: 6000,
        });
      } else {
        toast.success("Ticket Canceled", {
          description: `Ticket ${ticketKey} has been successfully canceled and withdrawn.`,
          duration: 6000,
        });
      }

      if (onTicketUpdated) {
        onTicketUpdated(ticketKey, newStatus);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to cancel request";
      setCancelError(msg);
      toast.error("Cancellation Failed", {
        description: msg,
        duration: 6000,
      });
    } finally {
      setCancelling(false);
    }
  };

  const statusStyle = detail
    ? getStatusStyle(detail.status, detail.statusCategory)
    : null;

  const isCanceled =
    statusStyle?.categoryKey === "canceled" ||
    (detail?.status || "").toLowerCase().includes("cancel") ||
    (detail?.status || "").toLowerCase().includes("withdraw");

  const isClosed =
    statusStyle?.categoryKey === "done" ||
    statusStyle?.categoryKey === "canceled" ||
    isCanceled;

  const workflowSteps = detail ? buildDynamicWorkflowSteps(detail) : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Ticket ${ticketKey || "Details"}`}
        className="relative z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full border-l border-slate-200/80 animate-slide-in-right overflow-hidden focus:outline-none"
      >
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between gap-4 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {detail ? (
              <>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-bold font-mono text-slate-800 transition-colors cursor-pointer"
                  title="Click to copy ticket key"
                >
                  <span>{detail.key}</span>
                  {copiedKey ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3 text-slate-400 group-hover:text-slate-600" />
                  )}
                </button>

                <StatusBadge
                  status={detail.status}
                  statusCategory={detail.statusCategory}
                />

                {detail.priority && (
                  <PriorityChip priority={detail.priority?.name || "Medium"} />
                )}
              </>
            ) : (
              <span className="text-sm font-bold text-slate-700">
                {ticketKey || "Ticket Detail"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {detail?.portalUrl && (
              <a
                href={detail.portalUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Open in Atlassian Customer Portal"
              >
                <ExternalLink className="size-4" />
              </a>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Copy shareable link"
            >
              {copiedLink ? (
                <Check className="size-4 text-emerald-600" />
              ) : (
                <Share2 className="size-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close drawer (Esc)"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body Scroll Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {loading ? (
            <div className="space-y-6 animate-pulse py-4">
              <div className="h-7 bg-slate-200 rounded-lg w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-24 bg-slate-100 rounded-xl w-full" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 bg-slate-100 rounded-xl" />
                <div className="h-20 bg-slate-100 rounded-xl" />
              </div>
              <div className="h-40 bg-slate-100 rounded-xl" />
            </div>
          ) : error ? (
            <div className="p-6 text-center space-y-3">
              <div className="size-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="size-6" />
              </div>
              <p className="font-bold text-slate-800 text-sm">
                Unable to load request
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  fetch(`/api/jsm/tickets/${encodeURIComponent(ticketKey || "")}`)
                    .then((r) => r.json())
                    .then((d) => setDetail(d))
                    .catch((e) => setError(e.message))
                    .finally(() => setLoading(false));
                }}
              >
                Retry
              </Button>
            </div>
          ) : detail ? (
            <>
              {/* Summary Title & Core Metadata */}
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {detail.summary}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {detail.projectName || "General Service Desk"}
                  </span>
                  <span>•</span>
                  <span>{detail.type || "Support Request"}</span>
                  {detail.created && (
                    <>
                      <span>•</span>
                      <span title={formatFullDate(detail.created)}>
                        Opened {formatRelativeTime(detail.created)}
                      </span>
                    </>
                  )}
                  {(detail.clientName || detail.organization) && (
                    <>
                      <span>•</span>
                      <ClientBadge
                        clientName={detail.clientName || detail.organization}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Dynamic Progression Stepper */}
              <Card className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Workflow Progress
                    </p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                        statusStyle?.bg || "bg-slate-100 text-slate-700"
                      )}
                    >
                      {detail.status}
                    </Badge>
                  </div>
                  {detail.updated && (
                    <span className="text-[11px] text-slate-400">
                      Updated {formatShortDate(detail.updated)}
                    </span>
                  )}
                </div>

                {/* Stepper Flow Nodes */}
                <div className="relative pt-1 pb-1">
                  <div className="flex items-start justify-between w-full">
                    {workflowSteps.map((step, idx) => {
                      const isLast = idx === workflowSteps.length - 1;
                      const nextStep = workflowSteps[idx + 1];

                      const isWaiting =
                        step.label.toLowerCase().includes("customer") ||
                        step.label.toLowerCase().includes("manager") ||
                        step.label.toLowerCase().includes("approval");

                      return (
                        <div
                          key={step.id}
                          className="flex-1 flex flex-col items-center relative text-center group min-w-0"
                        >
                          {/* Connecting Line to next step */}
                          {!isLast && (
                            <div
                              className={cn(
                                "absolute top-4 left-1/2 w-full h-[2px] -z-0 transition-all",
                                step.state === "completed" &&
                                  nextStep?.state === "completed"
                                  ? "bg-emerald-500"
                                  : step.state === "completed" &&
                                    nextStep?.state === "canceled"
                                  ? "bg-rose-400 border-t-2 border-dashed border-rose-300"
                                  : step.state === "completed" &&
                                    nextStep?.state === "current"
                                  ? "bg-linear-to-r from-emerald-500 to-blue-500"
                                  : "bg-slate-200"
                              )}
                            />
                          )}

                          {/* Node Circle */}
                          <div
                            className={cn(
                              "size-8 rounded-full flex items-center justify-center font-bold text-xs transition-all relative z-10 border-2",
                              step.state === "completed" &&
                                "bg-emerald-500 border-emerald-500 text-white shadow-xs shadow-emerald-500/30",
                              step.state === "current" &&
                                (isWaiting
                                  ? "bg-amber-500 border-amber-500 text-white ring-4 ring-amber-100 animate-pulse"
                                  : "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100 shadow-xs shadow-blue-500/30"),
                              step.state === "canceled" &&
                                "bg-rose-600 border-rose-600 text-white ring-4 ring-rose-100 shadow-xs shadow-rose-500/30",
                              step.state === "upcoming" &&
                                "bg-white border-slate-200 text-slate-400"
                            )}
                          >
                            {step.state === "completed" && (
                              <Check className="size-4 stroke-[3]" />
                            )}
                            {step.state === "current" &&
                              (isWaiting ? (
                                <Clock className="size-4" />
                              ) : (
                                <span className="size-2 rounded-full bg-white animate-ping" />
                              ))}
                            {step.state === "canceled" && (
                              <X className="size-4 stroke-[3]" />
                            )}
                            {step.state === "upcoming" && (
                              <span className="text-[11px] font-semibold">
                                {idx + 1}
                              </span>
                            )}
                          </div>

                          {/* Step Label */}
                          <span
                            className={cn(
                              "mt-2 text-xs font-semibold px-1 leading-tight break-words line-clamp-2",
                              step.state === "completed" && "text-slate-800",
                              step.state === "current" &&
                                (isWaiting
                                  ? "text-amber-800 font-bold"
                                  : "text-blue-700 font-bold"),
                              step.state === "canceled" &&
                                "text-rose-700 font-bold",
                              step.state === "upcoming" &&
                                "text-slate-400 font-normal"
                            )}
                          >
                            {step.label}
                          </span>

                          {/* Timestamp / Context Description */}
                          {step.date && (
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {formatShortDate(step.date)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              {/* Metadata Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Card className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
                  <p className="text-slate-400 text-[11px] font-semibold mb-1">
                    Client / Organization
                  </p>
                  <p className="font-bold text-slate-900">
                    {detail.clientName ||
                      detail.organization ||
                      "Direct / Internal"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Account Profile
                  </p>
                </Card>

                <Card className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
                  <p className="text-slate-400 text-[11px] font-semibold mb-1">
                    Service Desk Space
                  </p>
                  <p className="font-bold text-slate-900">
                    {detail.projectName || "IT Service Desk"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Key: {detail.projectKey || "IT"}
                  </p>
                </Card>

                <Card className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
                  <p className="text-slate-400 text-[11px] font-semibold mb-1">
                    Priority
                  </p>
                  <div className="pt-0.5">
                    <PriorityChip priority={detail.priority?.name || "Medium"} />
                  </div>
                </Card>

                <Card className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
                  <p className="text-slate-400 text-[11px] font-semibold mb-1">
                    Created
                  </p>
                  <p className="font-semibold text-slate-800">
                    {detail.created ? formatFullDate(detail.created) : "Recent"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {detail.created ? formatRelativeTime(detail.created) : ""}
                  </p>
                </Card>

                <Card className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
                  <p className="text-slate-400 text-[11px] font-semibold mb-1">
                    Reporter
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <Avatar className="size-6 text-xs">
                      <AvatarImage src={detail.reporter?.avatarUrl} />
                      <AvatarFallback className="bg-slate-100 text-slate-700 text-[10px]">
                        {detail.reporter?.displayName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-slate-800 text-xs truncate">
                      {detail.reporter?.displayName || "You"}
                    </span>
                  </div>
                </Card>

                <Card className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
                  <p className="text-slate-400 text-[11px] font-semibold mb-1">
                    Assigned Agent
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <Avatar className="size-6 text-xs">
                      <AvatarImage src={detail.assignee?.avatarUrl} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px]">
                        {detail.assignee?.displayName?.charAt(0) || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-slate-800 text-xs truncate">
                      {detail.assignee?.displayName || "Triage Queue / Unassigned"}
                    </span>
                  </div>
                </Card>
              </div>

              <Separator className="my-2 bg-slate-200/80" />

              {/* Conversation Activity Thread */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="size-4 text-slate-400" />
                    <span>Activity & Comments</span>
                  </h2>
                  <span className="text-xs text-slate-400">
                    {detail.comments?.length || 0} messages
                  </span>
                </div>

                <div className="space-y-3">
                  {detail.comments && detail.comments.length > 0 ? (
                    detail.comments.map((comment) => (
                      <Card
                        key={comment.id}
                        className={cn(
                          "p-4 rounded-xl space-y-2 border transition-all text-xs",
                          comment.author.isAgent
                            ? "bg-blue-50/50 border-blue-200/80"
                            : "bg-white border-slate-200/80"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6 text-xs">
                              <AvatarImage src={comment.author.avatarUrl} />
                              <AvatarFallback
                                className={cn(
                                  "text-[10px] font-bold",
                                  comment.author.isAgent
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-200 text-slate-700"
                                )}
                              >
                                {comment.author.displayName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-slate-900 text-xs">
                              {comment.author.displayName}
                            </span>
                            {comment.author.isAgent && (
                              <Badge
                                variant="secondary"
                                className="px-1.5 py-0 text-[10px] font-semibold bg-blue-100 text-blue-700 border-blue-200"
                              >
                                Support Agent
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {formatRelativeTime(comment.created)}
                          </span>
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-xs pl-8">
                          {comment.body}
                        </p>
                      </Card>
                    ))
                  ) : (
                    <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <p className="text-xs text-slate-400">
                        No comments or customer updates on this ticket yet.
                      </p>
                    </div>
                  )}
                  <div ref={commentsEndRef} />
                </div>

                {/* Reply Form (Only if ticket is not closed) */}
                {!isClosed ? (
                  <form onSubmit={handlePostComment} className="pt-2">
                    <div className="space-y-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a reply, follow-up, or extra details for the support team..."
                        rows={3}
                        className="w-full text-xs rounded-xl bg-slate-50/50 focus:bg-white resize-none"
                        disabled={submittingComment}
                      />
                      {commentError && (
                        <p className="text-xs text-rose-600 font-medium">
                          {commentError}
                        </p>
                      )}
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-[11px] text-slate-400">
                          Replies are visible to support agents working this request.
                        </span>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!newComment.trim() || submittingComment}
                          className="cursor-pointer gap-1.5"
                        >
                          <Send className="size-3.5" />
                          <span>
                            {submittingComment ? "Posting..." : "Send Reply"}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <p className="text-xs text-slate-500">
                      This ticket is {detail.status.toLowerCase()}. Further replies are closed.
                    </p>
                  </div>
                )}
              </div>

              {/* Upgraded Cancel Request Section UI */}
              {!isClosed ? (
                <div className="p-4 sm:p-5 rounded-2xl border border-rose-200/90 bg-rose-50/40 space-y-3 mt-6">
                  {!showCancelConfirm ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="size-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Ban className="size-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-rose-950">
                            Cancel or Withdraw Request
                          </p>
                          <p className="text-[11px] text-rose-700/80 mt-0.5 leading-relaxed">
                            If this request is no longer needed, you can withdraw it from the active queue.
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCancelError(null);
                          setShowCancelConfirm(true);
                        }}
                        className="cursor-pointer border-rose-300 text-rose-700 hover:bg-rose-100/70 hover:text-rose-800 font-semibold shrink-0"
                      >
                        Cancel Request
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white border border-rose-200 shadow-xs space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="size-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Confirm Cancellation for {ticketKey}?
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            Are you sure you want to cancel this ticket? The assigned specialist will be notified and this request will be closed.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCancelError(null);
                            setShowCancelConfirm(false);
                          }}
                          disabled={cancelling}
                          className="cursor-pointer text-slate-600 hover:bg-slate-100 text-xs"
                        >
                          No, Keep It
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleCancelTicket}
                          disabled={cancelling}
                          className="cursor-pointer bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5"
                        >
                          {cancelling ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" />
                              <span>Cancelling...</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="size-3.5" />
                              <span>Yes, Confirm Cancellation</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {cancelError && (
                    <div className="p-2.5 rounded-lg bg-rose-100/80 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="size-4 shrink-0 text-rose-600" />
                      <span>{cancelError}</span>
                    </div>
                  )}
                </div>
              ) : isCanceled ? (
                /* Sleek confirmation banner displayed when ticket was canceled */
                <div className="p-4 rounded-2xl border border-rose-200/90 bg-rose-50/50 flex items-center gap-3 mt-6">
                  <div className="size-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <XCircle className="size-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-rose-950">
                      Request Canceled
                    </p>
                    <p className="text-[11px] text-rose-700/80 mt-0.5">
                      This request has been withdrawn and closed. No further support actions are pending.
                    </p>
                  </div>
                </div>
              ) : (
                /* Sleek confirmation banner displayed when ticket was resolved */
                <div className="p-4 rounded-2xl border border-emerald-200/90 bg-emerald-50/50 flex items-center gap-3 mt-6">
                  <div className="size-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="size-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-emerald-950">
                      Request Resolved
                    </p>
                    <p className="text-[11px] text-emerald-700/80 mt-0.5">
                      This ticket has been completed and verified by the support team.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
