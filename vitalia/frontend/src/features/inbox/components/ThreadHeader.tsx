// cap: sales_agent.inbox-handler-mode-occ
// story-origin: TBD
"use client";

/**
 * ThreadHeader.tsx — Header bar for the conversation thread pane.
 *
 * Assembly of:
 *   - PatientNameChannel: patient name (PHI-wrapped) + channel badge
 *   - SegmentedControl3Modes: 3-state mode toggle via useModeToggle
 *   - VoiceStyleChip: read-only style indicator
 *   - PauseAdrianButton: 60min pause trigger (⏸)
 *   - ToolsSheetTrigger: opens tools sheet (🛠)
 *   - ContactSidebarToggle: toggles right sidebar (👤)
 *
 * Uses useInboxStore for sidebar + tools sheet state.
 * Uses useModeToggle for OCC mode switching.
 *
 * On mode conflict (409): shows conflict error state inline via isConflict.
 * Toast responsibility belongs to parent (ConversationThread).
 *
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */

import { cn } from "@/lib/cn";
import { useInboxStore } from "../store/inbox-store";
import {
  useModeToggle,
  conversationToSegmentValue,
} from "../hooks/use-mode-toggle";
import type { ConversationDetail } from "../types/conversation-detail";
import { SegmentedControl3Modes } from "./SegmentedControl3Modes";
import { VoiceStyleChip } from "./VoiceStyleChip";
import { PauseAdrianButton } from "./PauseAdrianButton";
import { ToolsSheetTrigger } from "./ToolsSheetTrigger";
import { ContactSidebarToggle } from "./ContactSidebarToggle";

interface ThreadHeaderProps {
  /** Full conversation detail (conversation + lead) */
  detail: ConversationDetail;
  /** Whether a brand voice style has been configured */
  voiceConfigured?: boolean;
  /** Display label for the configured voice style */
  voiceStyleLabel?: string | null;
  /** Called after a successful pause (for parent toast) */
  onPauseSuccess?: () => void;
  className?: string;
}

/**
 * ThreadHeader — top bar for the conversation thread panel.
 * Client Component: owns mode toggle, store reads, and button callbacks.
 */
export function ThreadHeader({
  detail,
  voiceConfigured = false,
  voiceStyleLabel,
  onPauseSuccess,
  className,
}: ThreadHeaderProps) {
  const { conversation, lead } = detail;
  const contactSidebarOpen = useInboxStore((s) => s.contactSidebarOpen);
  const toggleContactSidebar = useInboxStore((s) => s.toggleContactSidebar);
  const expandedActivityStream = useInboxStore((s) => s.expandedActivityStream);
  const toggleActivityStream = useInboxStore((s) => s.toggleActivityStream);

  const { toggle, isPending, isConflict } = useModeToggle(
    conversation.id,
    conversation,
  );

  const segmentValue = conversationToSegmentValue(conversation);

  return (
    <header
      className={cn(
        "flex flex-col gap-2 px-4 py-3 border-b vt-border shrink-0",
        "vt-bg-surface",
        className,
      )}
      data-testid="thread-header"
    >
      {/* Row 1: Patient name + channel + action buttons */}
      <div className="flex items-center justify-between gap-2">
        {/* Patient name + channel */}
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="truncate text-sm font-semibold vt-text-foreground"
            data-testid="thread-header-patient-name"
          >
            {lead.name}
          </span>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium vt-bg-muted vt-text-muted uppercase"
            data-testid="thread-header-channel"
          >
            {conversation.channel}
          </span>
        </div>

        {/* Action buttons: ⏸ 🛠 👤 */}
        <div className="flex items-center gap-1 shrink-0">
          <PauseAdrianButton
            conversationId={conversation.id}
            pauseUntil={conversation.pause_until}
            onPauseSuccess={onPauseSuccess}
          />
          <ToolsSheetTrigger
            isOpen={expandedActivityStream}
            onClick={toggleActivityStream}
          />
          <ContactSidebarToggle
            isOpen={contactSidebarOpen}
            onClick={toggleContactSidebar}
          />
        </div>
      </div>

      {/* Row 2: SegmentedControl3Modes + VoiceStyleChip */}
      <div className="flex items-center gap-3 flex-wrap">
        <SegmentedControl3Modes
          value={segmentValue}
          onChange={toggle}
          isPending={isPending}
          isConflict={isConflict}
        />
        <VoiceStyleChip
          isConfigured={voiceConfigured}
          styleLabel={voiceStyleLabel}
        />
      </div>
    </header>
  );
}
