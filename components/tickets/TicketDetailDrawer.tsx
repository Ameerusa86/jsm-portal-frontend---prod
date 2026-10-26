"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Send,
  AlertCircle,
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-2xl bg-background border-l border-border h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-250 pb-[env(safe-area-inset-bottom,0px)] text-foreground">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-border bg-muted/40 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {/* Key Badge */}
            <Badge
              variant="outline"
              className="font-mono text-sm sm:text-base font-bold text-blue-700 bg-blue-50 border-blue-200/80 px-2.5 py-1 rounded-lg shrink-0"
            >
              {ticketKey}
            </Badge>

            {/* Copy Key Button */}
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={handleCopyKey}
              className="cursor-pointer"
              title="Copy issue key"
            >
              {copiedKey ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>

            {/* Share Link Button */}
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={handleCopyLink}
              className="cursor-pointer"
              title="Copy direct shareable link"
            >
              {copiedLink ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Share2 className="size-3.5" />
              )}
            </Button>

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(detail.portalUrl, "_blank", "noopener,noreferrer")}
                className="hidden sm:inline-flex cursor-pointer gap-1.5"
                title="View in native Atlassian portal"
              >
                <span>Jira Portal</span>
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </Button>
            )}

            {/* Close Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Drawer Body Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading ? (
            <div className="space-y-4 py-8">
              <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-20 bg-muted/60 rounded-xl animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-14 bg-muted/60 rounded-xl animate-pulse" />
                <div className="h-14 bg-muted/60 rounded-xl animate-pulse" />
              </div>
              <div className="h-40 bg-muted/60 rounded-xl animate-pulse" />
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-center space-y-2">
              <AlertCircle className="size-8 text-destructive mx-auto" />
              <p className="text-sm font-bold text-destructive">
                Failed to load ticket details
              </p>
              <p className="text-xs text-destructive/80">{error}</p>
            </div>
          ) : detail ? (
            <>
              {/* Title & Request Type & Client */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                  {detail.summary}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
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
              <Card className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Progress Tracker
                </p>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="flex flex-col items-center">
                    <div className="size-7 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center font-bold text-xs mb-1">
                      ✓
                    </div>
                    <span className="text-[11px] text-slate-800 font-semibold">
                      Submitted
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "size-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 border",
                        detail.statusCategory !== "NEW"
                          ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                          : "bg-blue-100 border-blue-400 text-blue-700 animate-pulse"
                      )}
                    >
                      {detail.statusCategory !== "NEW" ? "✓" : "2"}
                    </div>
                    <span className="text-[11px] text-slate-800 font-semibold">
                      Reviewed
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "size-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 border",
                        isClosed
                          ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                          : detail.statusCategory === "INDETERMINATE"
                          ? "bg-blue-100 border-blue-400 text-blue-700 animate-pulse"
                          : "bg-slate-100 border-slate-200 text-slate-400"
                      )}
                    >
                      {isClosed ? "✓" : "3"}
                    </div>
                    <span className="text-[11px] text-slate-800 font-semibold">
                      In Progress
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "size-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 border",
                        isClosed
                          ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                          : "bg-slate-100 border-slate-200 text-slate-400"
                      )}
                    >
                      {isClosed ? "✓" : "4"}
                    </div>
                    <span className="text-[11px] text-slate-800 font-semibold">
                      Resolved
                    </span>
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
                    {detail.clientName || detail.organization || "Direct / Internal"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Account Profile</p>
                </Card>

                <Card className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
                  <p className="text-slate-400 text-[11px] font-semibold mb-1">
                    Assigned Specialist
                  </p>
                  <p className="font-bold text-slate-900 truncate">
                    {detail.assignee?.displayName || "Support Team"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {detail.assignee?.emailAddress || "Tier 2 Support"}
                  </p>
                </Card>

                <Card className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
                  <p className="text-slate-400 text-[11px] font-semibold mb-1">
                    Created
                  </p>
                  <p className="font-bold text-slate-900">
                    {formatFullDate(detail.created)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formatRelativeTime(detail.created)}
                  </p>
                </Card>

                <Card className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
                  <p className="text-slate-400 text-[11px] font-semibold mb-1">
                    Last Updated
                  </p>
                  <p className="font-bold text-slate-900">
                    {formatFullDate(detail.updated || detail.created)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formatRelativeTime(detail.updated || detail.created)}
                  </p>
                </Card>
              </div>

              {/* Public Conversation & Comments Thread */}
              <div className="space-y-3 pt-2">
                <Separator />
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
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
                        <Card
                          key={comment.id}
                          className={cn(
                            "p-4 rounded-xl border space-y-2.5 shadow-2xs",
                            isAgent
                              ? "bg-blue-50/40 border-blue-200"
                              : "bg-slate-50/60 border-slate-200/80"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar size="sm" className="size-6 border border-slate-200">
                                {comment.author?.avatarUrl && (
                                  <AvatarImage
                                    src={comment.author.avatarUrl}
                                    alt={comment.author.displayName}
                                  />
                                )}
                                <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px] font-bold">
                                  {comment.author?.displayName?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-bold text-xs text-slate-900">
                                {comment.author?.displayName}
                              </span>
                              {isAgent && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-bold px-1.5 py-0 rounded bg-blue-100 text-blue-700 border-blue-200"
                                >
                                  Support Agent
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {formatRelativeTime(comment.created)}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {comment.body}
                          </p>
                        </Card>
                      );
                    })
                  ) : (
                    <Card className="p-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                      No customer comments logged yet. Use the field below to
                      send a message or update to our support team.
                    </Card>
                  )}
                  <div ref={commentsEndRef} />
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleSubmitComment} className="pt-2">
                  <div className="relative space-y-2">
                    <Textarea
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add an update, reply to support, or attach additional details..."
                      className="bg-muted/30 border-border focus-visible:bg-background transition-all"
                      disabled={submittingComment}
                    />

                    {commentError && (
                      <p className="text-xs text-destructive font-medium">
                        {commentError}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-muted-foreground">
                        Press Send to notify the support engineer
                      </span>

                      <Button
                        type="submit"
                        variant="default"
                        size="sm"
                        disabled={submittingComment || !newComment.trim()}
                        className="cursor-pointer gap-1.5"
                      >
                        <Send className="size-3.5" />
                        <span>
                          {submittingComment ? "Sending..." : "Send Reply"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Danger Zone: Cancel Request */}
              {!isClosed && (
                <div className="p-4 rounded-2xl border border-destructive/20 bg-destructive/10 space-y-2 mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-destructive">
                        Cancel this request?
                      </p>
                      <p className="text-[11px] text-destructive/80 mt-0.5">
                        If this request is no longer needed, you can withdraw it
                        from the active queue.
                      </p>
                    </div>

                    {!showCancelConfirm ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCancelConfirm(true)}
                        className="cursor-pointer border-destructive/30 text-destructive hover:bg-destructive/10"
                      >
                        Cancel Request
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCancelConfirm(false)}
                          disabled={cancelling}
                          className="cursor-pointer"
                        >
                          No, Keep It
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleCancelTicket}
                          disabled={cancelling}
                          className="cursor-pointer"
                        >
                          {cancelling ? "Cancelling..." : "Yes, Confirm"}
                        </Button>
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
