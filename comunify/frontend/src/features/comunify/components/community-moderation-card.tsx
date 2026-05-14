"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { CommunityPost, ModerationAction } from "../types/community.types";

interface CommunityModerationCardProps {
  post: CommunityPost;
  onAction: (postId: string, action: ModerationAction, reason?: string) => void;
  isPending?: boolean;
  className?: string;
}

const ACTION_LABELS: Record<ModerationAction, string> = {
  approve: "Aprobar",
  reject: "Rechazar",
  ban: "Banear miembro",
};

const ACTION_STYLES: Record<ModerationAction, string> = {
  approve: "bg-green-600 hover:bg-green-700 text-white",
  reject: "bg-yellow-600 hover:bg-yellow-700 text-white",
  ban: "bg-red-600 hover:bg-red-700 text-white",
};

export function CommunityModerationCard({
  post,
  onAction,
  isPending,
  className,
}: CommunityModerationCardProps) {
  const [reason, setReason] = useState("");
  const [showReason, setShowReason] = useState(false);
  const [pendingAction, setPendingAction] = useState<ModerationAction | null>(null);

  const handleAction = (action: ModerationAction) => {
    if (action !== "approve") {
      setPendingAction(action);
      setShowReason(true);
      return;
    }
    onAction(post.id, action);
  };

  const confirmAction = () => {
    if (!pendingAction) return;
    onAction(post.id, pendingAction, reason || undefined);
    setShowReason(false);
    setPendingAction(null);
    setReason("");
  };

  return (
    <article
      className={cn("rounded-xl border bg-card p-4", className)}
      aria-label={`Post de ${post.author_name} pendiente de moderación`}
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{post.author_name}</p>
          <p className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("es-419", { dateStyle: "short", timeStyle: "short" }).format(
              new Date(post.created_at)
            )}
            {post.cohort_id && (
              <span className="ml-2 rounded-full bg-secondary px-1.5 py-0.5 text-xs">
                Cohorte
              </span>
            )}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            post.status === "pending_moderation" && "bg-yellow-100 text-yellow-700",
            post.status === "approved" && "bg-green-100 text-green-700",
            post.status === "rejected" && "bg-red-100 text-red-700",
            post.status === "removed" && "bg-gray-100 text-gray-700"
          )}
        >
          {post.status}
        </span>
      </header>

      <p className="mb-4 text-sm leading-relaxed">{post.content}</p>

      {showReason && (
        <div className="mb-3">
          <label htmlFor={`reason-${post.id}`} className="mb-1 block text-xs font-medium text-muted-foreground">
            Motivo (opcional)
          </label>
          <input
            id={`reason-${post.id}`}
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Describe el motivo de la acción..."
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={confirmAction}
              disabled={isPending}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => { setShowReason(false); setPendingAction(null); }}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!showReason && post.status === "pending_moderation" && (
        <div className="flex flex-wrap gap-2">
          {(["approve", "reject", "ban"] as ModerationAction[]).map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => handleAction(action)}
              disabled={isPending}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50",
                ACTION_STYLES[action]
              )}
              aria-label={`${ACTION_LABELS[action]} post de ${post.author_name}`}
            >
              {ACTION_LABELS[action]}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
