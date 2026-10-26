"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Send,
  AlertCircle,
  Clock,
  User,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  Share2,
  Building,
} from "lucide-react";
import Image from "next/image";
import { TicketItem, TicketDetail, TicketCommentItem } from "@/types/jsm";
import {
  StatusBadge,
  PriorityChip,
  ClientBadge,
  formatRelativeTime,
  formatFullDate,
  getStatusStyle,
} from "./TicketBadge";

interface TicketDetailDrawerProps {
  ticketKey: string | null;
  onClose: () => void;
  onTicketUpdated?: (updatedKey: string, newStatus: string) => void;
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

  // Load ticket detail when ticketKey changes
  useEffect(() => {
    if (!ticketKey) return;

    let ignore = false;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      setShowCancelConfirm(false);

      try {
        const res = await fetch(
          `/api/jsm/tickets/${encodeURIComponent(ticketKey)}`
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load ticket details");
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

  if (!ticketKey) return null;

  const handleCopyKey = () => {
    if (navigator.clipboard && ticketKey) {
      navigator.clipboard.writeText(ticketKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      const shareUrl = `${window.location.origin}/tickets?id=${ticketKey}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment || !ticketKey) return;

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
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error posting comment";
      setCommentError(msg);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCancelTicket = async () => {
    if (!ticketKey || cancelling) return;
    setCancelling(true);

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

      if (detail) {
        setDetail({
          ...detail,
          status: "Canceled",
          statusCategory: "DONE",
        });
      }

      setShowCancelConfirm(false);
      if (onTicketUpdated) {
        onTicketUpdated(ticketKey, "Canceled");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel request");
    } finally {
      setCancelling(false);
    }
  };

  const statusStyle = detail
    ? getStatusStyle(detail.status, detail.statusCategory)
    : null;

  const isClosed =
    statusStyle?.categoryKey === "done" ||
    statusStyle?.categoryKey === "canceled";

  if (!ticketKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-2xl bg-white border-l border-slate-200 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-250 pb-[env(safe-area-inset-bottom,0px)] text-slate-900">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {/* Key Badge */}
            <span className="font-mono text-sm sm:text-base font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/80 shrink-0">
              {ticketKey}
            </span>

            {/* Copy Key Button */}
            <button
              type="button"
              onClick={handleCopyKey}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              title="Copy issue key"
            >
              {copiedKey ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {/* Share Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              title="Copy direct shareable link"
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            {/* Status Badge */}
            {detail && (
              <StatusBadge
                status={detail.status}
                statusCategory={detail.statusCategory}
              />
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Open in Native Jira link */}
            {detail?.portalUrl && (
              <a
                href={detail.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors"
                title="View in native Atlassian portal"
              >
                <span>Jira Portal</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading ? (
            <div className="space-y-4 py-8">
              <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse" />
              <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-14 bg-slate-100 rounded-xl animate-pulse" />
              </div>
              <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
              <p className="text-sm font-bold text-rose-900">
                Failed to load ticket details
              </p>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          ) : detail ? (
            <>
              {/* Title & Request Type & Client */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  {detail.summary}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {detail.type}
                  </span>
                  <span>•</span>
                  <span>{detail.projectName || detail.projectKey || "General"}</span>
                  {detail.priority && (
                    <>
                      <span>•</span>
                      <PriorityChip
                        priority={detail.priority.name}
                        showLabel={true}
                      />
                    </>
                  )}
                  {(detail.clientName || detail.organization) && (
                    <>
                      <span>•</span>
                      <ClientBadge clientName={detail.clientName || detail.organization} />
                    </>
                  )}
                </div>
              </div>

              {/* Progression Stepper */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Progress Tracker
                </p>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center font-bold text-xs mb-1">
                      ✓
                    </div>
                    <span className="text-[11px] text-slate-700 font-semibold">
                      Submitted
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 border ${
                        detail.statusCategory !== "NEW"
                          ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                          : "bg-blue-100 border-blue-400 text-blue-700 animate-pulse"
                      }`}
                    >
                      {detail.statusCategory !== "NEW" ? "✓" : "2"}
                    </div>
                    <span className="text-[11px] text-slate-700 font-semibold">
                      Reviewed
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 border ${
                        isClosed
                          ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                          : detail.statusCategory === "INDETERMINATE"
                          ? "bg-blue-100 border-blue-400 text-blue-700 animate-pulse"
                          : "bg-slate-100 border-slate-200 text-slate-400"
                      }`}
                    >
                      {isClosed ? "✓" : "3"}
                    </div>
                    <span className="text-[11px] text-slate-700 font-semibold">
                      In Progress
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 border ${
                        isClosed
                          ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                          : "bg-slate-100 border-slate-200 text-slate-400"
                      }`}
                    >
                      {isClosed ? "✓" : "4"}
                    </div>
                    <span className="text-[11px] text-slate-700 font-semibold">
                      Resolved
                    </span>
                  </div>
                </div>
              </div>

              {/* Metadata Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-slate-500 text-[11px] font-semibold mb-1">
                    Client / Organization
                  </p>
                  <p className="font-bold text-slate-800">
                    {detail.clientName || detail.organization || "Direct / Internal"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Account Profile</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-slate-500 text-[11px] font-semibold mb-1">
                    Assigned Specialist
                  </p>
                  <p className="font-bold text-slate-800 truncate">
                    {detail.assignee?.displayName || "Support Team"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {detail.assignee?.emailAddress || "Tier 2 Support"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-slate-500 text-[11px] font-semibold mb-1">
                    Created
                  </p>
                  <p className="font-bold text-slate-800">
                    {formatFullDate(detail.created)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formatRelativeTime(detail.created)}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-slate-500 text-[11px] font-semibold mb-1">
                    Last Updated
                  </p>
                  <p className="font-bold text-slate-800">
                    {formatFullDate(detail.updated || detail.created)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formatRelativeTime(detail.updated || detail.created)}
                  </p>
                </div>
              </div>

              {/* Public Conversation & Comments Thread */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Conversation Thread (
                    {(detail.comments && detail.comments.length) || 0})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Visible to Support Team
                  </span>
                </div>

                {/* Comments List */}
                <div className="space-y-3">
                  {detail.comments && detail.comments.length > 0 ? (
                    detail.comments.map((comment) => {
                      const isAgent = comment.author?.isAgent;

                      return (
                        <div
                          key={comment.id}
                          className={`p-4 rounded-2xl border ${
                            isAgent
                              ? "bg-blue-50/50 border-blue-200"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              {comment.author?.avatarUrl ? (
                                <Image
                                  src={comment.author.avatarUrl}
                                  alt={comment.author.displayName}
                                  width={24}
                                  height={24}
                                  className="w-6 h-6 rounded-full object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[10px] font-bold text-blue-700">
                                  {comment.author?.displayName
                                    ?.charAt(0)
                                    .toUpperCase() || "U"}
                                </div>
                              )}
                              <span className="font-bold text-xs text-slate-900">
                                {comment.author?.displayName}
                              </span>
                              {isAgent && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 border border-blue-200">
                                  Support Agent
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {formatRelativeTime(comment.created)}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {comment.body}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                      No customer comments logged yet. Use the field below to
                      send a message or update to our support team.
                    </div>
                  )}
                  <div ref={commentsEndRef} />
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleSubmitComment} className="pt-2">
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add an update, reply to support, or attach additional details..."
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-2xl p-3.5 transition-all resize-none shadow-2xs"
                      disabled={submittingComment}
                    />

                    {commentError && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">
                        {commentError}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-slate-400">
                        Press Send to notify the support engineer
                      </span>

                      <button
                        type="submit"
                        disabled={submittingComment || !newComment.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm shadow-blue-600/20 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {submittingComment ? "Sending..." : "Send Reply"}
                        </span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Danger Zone: Cancel Request */}
              {!isClosed && (
                <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/60 space-y-2 mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-rose-800">
                        Cancel this request?
                      </p>
                      <p className="text-[11px] text-rose-600/80 mt-0.5">
                        If this request is no longer needed, you can withdraw it
                        from the active queue.
                      </p>
                    </div>

                    {!showCancelConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(true)}
                        className="px-3 py-1.5 rounded-xl border border-rose-300 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Cancel Request
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(false)}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold"
                          disabled={cancelling}
                        >
                          No, Keep It
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelTicket}
                          disabled={cancelling}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          {cancelling ? "Cancelling..." : "Yes, Confirm"}
                        </button>
                      </div>
                    )}
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
