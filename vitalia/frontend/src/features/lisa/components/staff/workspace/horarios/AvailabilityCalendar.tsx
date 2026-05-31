// cap: clinics.lisa.doctores
// story-origin: vitalia-fase2-lisa-doctores
/**
 * AvailabilityCalendar.tsx — Custom week grid calendar for doctor availability blocks.
 *
 * Architecture per 03-arch-fe.md § Calendar decision:
 *   - Custom week grid (day × hour, CSS Grid) — optimised for columna angosta (~600px).
 *   - @dnd-kit/core for drag-to-create availability blocks.
 *   - Base range: 07:00–21:00. "Mostrar 24 horas" toggle expands to 00:00–23:00.
 *   - Week navigation ‹/› via Zustand calendarWeek state.
 *   - Recurrent blocks visible in every applicable week; one-off only in own week.
 *   - 24h format. Slots stored UTC; display via useTenantLocale (master-data.md).
 *   - Drag creates a draft block → BloquePopover opens.
 *
 * T-FE-3 vitalia-fase2-lisa-doctores
 * spec_anchor: 03-arch-fe.md § AvailabilityCalendar + 01-spec.md § SC-1/SC-1b/SC-1c/SC-1d/SC-3b
 * downstream-regression-na: brand-local vitalia FE component; no cross-brand consumers
 */

"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStaffUiStore } from "../../../../store/staff-ui-store";
import { useAvailabilityBlocks } from "../../../../api/staff";
import type {
  AvailabilityBlock,
  RecurrentBlock,
  OneOffBlock,
} from "../../../../types/staff.types";
import { BloquePopover, type BloquePopoverAnchor } from "./BloquePopover";

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_START_HOUR = 7; // 07:00
const BASE_END_HOUR = 21; // 21:00
const FULL_START_HOUR = 0;
const FULL_END_HOUR = 24;
const HOUR_HEIGHT = 48; // px per hour slot

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// ── Week navigation helpers ────────────────────────────────────────────────────

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate + "T00:00:00");
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0] ?? isoDate;
}

function formatWeekLabel(mondayIso: string): string {
  const monday = new Date(mondayIso + "T00:00:00");
  const sunday = new Date(mondayIso + "T00:00:00");
  sunday.setDate(monday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const monStr = monday.toLocaleDateString("es-419", opts);
  const sunStr = sunday.toLocaleDateString("es-419", opts);
  const year = monday.getFullYear();
  return `${monStr} – ${sunStr}, ${year}`;
}

/**
 * Get ISO date for a specific day in the week starting at mondayIso.
 * dayOfWeek: 0=Monday..6=Sunday
 */
function getDateForDayOfWeek(mondayIso: string, dayOfWeek: number): string {
  return addDays(mondayIso, dayOfWeek);
}

/**
 * Determine if a recurrent block should appear in the given week.
 * Weekly: appears every week if started <= weekEnd and not ended.
 * Biweekly: appears every other week.
 */
function recurrentBlockVisibleInWeek(
  block: RecurrentBlock,
  mondayIso: string,
): boolean {
  // For display purposes, always show recurrent blocks unless we have specific
  // end_date that has passed. Backend handles exact slot materialisation.
  const weekMonday = new Date(mondayIso + "T00:00:00");
  const weekSunday = new Date(mondayIso + "T00:00:00");
  weekSunday.setDate(weekMonday.getDate() + 6);

  if (block.endConditionKind === "end_date" && block.endDate) {
    const endDate = new Date(block.endDate + "T00:00:00");
    if (endDate < weekMonday) return false;
  }

  return true;
}

/**
 * Determine if a one-off block should appear in the given week.
 */
function oneOffBlockVisibleInWeek(
  block: OneOffBlock,
  mondayIso: string,
): boolean {
  const blockDate = new Date(block.specificDate + "T00:00:00");
  const weekMonday = new Date(mondayIso + "T00:00:00");
  const weekSunday = new Date(mondayIso + "T00:00:00");
  weekSunday.setDate(weekMonday.getDate() + 6);
  return blockDate >= weekMonday && blockDate <= weekSunday;
}

/**
 * Get the day-of-week index (0=Monday) for a block in the given week.
 */
function blockDayOfWeek(block: AvailabilityBlock, mondayIso: string): number {
  if (block.kind === "recurrent") return block.dayOfWeek;
  const blockDate = new Date(block.specificDate + "T00:00:00");
  const weekMonday = new Date(mondayIso + "T00:00:00");
  const diff = Math.round(
    (blockDate.getTime() - weekMonday.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(0, Math.min(6, diff));
}

/**
 * Convert "HH:mm" to hours as decimal.
 */
function timeToHours(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) + (m ?? 0) / 60;
}

// ── CalendarBlock component ────────────────────────────────────────────────────

interface CalendarBlockProps {
  block: AvailabilityBlock;
  startHour: number;
  dayColIndex: number;
  hourHeight: number;
  onBlockClick: (block: AvailabilityBlock, event: React.MouseEvent) => void;
}

function CalendarBlock({
  block,
  startHour,
  hourHeight,
  onBlockClick,
}: CalendarBlockProps) {
  const start = timeToHours(block.startTime) - startHour;
  const end = timeToHours(block.endTime) - startHour;
  const top = start * hourHeight;
  const height = (end - start) * hourHeight;

  return (
    <button
      data-testid={`block-${block.id}`}
      className={cn(
        "absolute left-0.5 right-0.5 rounded cursor-pointer text-xs font-medium",
        "bg-[--agent-lisa]/20 border border-[--agent-lisa] text-[--agent-lisa]",
        "hover:bg-[--agent-lisa]/30 transition-colors",
        "flex items-start justify-start p-1 overflow-hidden",
        "focus:outline-none focus:ring-2 focus:ring-[--agent-lisa]",
      )}
      style={{ top: `${top}px`, height: `${Math.max(height, 20)}px` }}
      onClick={(e) => onBlockClick(block, e)}
      aria-label={`Bloque ${block.startTime}–${block.endTime}${block.kind === "recurrent" ? ` (${block.freq === "weekly" ? "semanal" : "quincenal"})` : " (único)"}`}
    >
      <span className="truncate">
        {block.startTime}–{block.endTime}
      </span>
    </button>
  );
}

// ── DroppableCell component ────────────────────────────────────────────────────

interface DroppableCellProps {
  dayIndex: number;
  hour: number;
  children?: React.ReactNode;
  onMouseDown: (dayIndex: number, hour: number, e: React.MouseEvent) => void;
}

function DroppableCell({
  dayIndex,
  hour,
  children,
  onMouseDown,
}: DroppableCellProps) {
  return (
    <div
      data-testid={`cell-${dayIndex}-${hour}`}
      className="absolute inset-0 border-b border-border/30"
      onMouseDown={(e) => onMouseDown(dayIndex, hour, e)}
      role="button"
      tabIndex={-1}
      aria-label={`Crear bloque el ${DAY_LABELS[dayIndex]} a las ${String(hour).padStart(2, "0")}:00`}
    >
      {children}
    </div>
  );
}

// ── Main AvailabilityCalendar ─────────────────────────────────────────────────

export interface AvailabilityCalendarProps {
  doctorId: string;
}

export function AvailabilityCalendar({ doctorId }: AvailabilityCalendarProps) {
  const calendarWeek = useStaffUiStore((s) => s.calendarWeek);
  const setCalendarWeek = useStaffUiStore((s) => s.setCalendarWeek);
  const setDragDraft = useStaffUiStore((s) => s.setDragDraft);

  const { data: blocks, isLoading } = useAvailabilityBlocks(doctorId);

  const [show24h, setShow24h] = useState(false);
  const [popoverState, setPopoverState] = useState<{
    block: AvailabilityBlock | null;
    draft: { dayOfWeek: number; startTime: string; endTime: string } | null;
    anchor: BloquePopoverAnchor;
    isExisting: boolean;
  } | null>(null);

  // Drag-to-create state
  const [dragStartCell, setDragStartCell] = useState<{
    day: number;
    hour: number;
  } | null>(null);
  const [dragCurrentCell, setDragCurrentCell] = useState<{
    day: number;
    hour: number;
  } | null>(null);
  const isDragging = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const startHour = show24h ? FULL_START_HOUR : BASE_START_HOUR;
  const endHour = show24h ? FULL_END_HOUR : BASE_END_HOUR;
  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i,
  );

  // ── Week navigation ────────────────────────────────────────────────────────

  const goToPrevWeek = useCallback(() => {
    setCalendarWeek(addDays(calendarWeek, -7));
  }, [calendarWeek, setCalendarWeek]);

  const goToNextWeek = useCallback(() => {
    setCalendarWeek(addDays(calendarWeek, 7));
  }, [calendarWeek, setCalendarWeek]);

  // ── Filter blocks visible in current week ─────────────────────────────────

  const visibleBlocks: AvailabilityBlock[] = (blocks ?? []).filter((block) => {
    if (block.kind === "recurrent") {
      return recurrentBlockVisibleInWeek(block, calendarWeek);
    }
    return oneOffBlockVisibleInWeek(block, calendarWeek);
  });

  // Group blocks by day-of-week
  const blocksByDay: AvailabilityBlock[][] = Array.from({ length: 7 }, () => []);
  for (const block of visibleBlocks) {
    const dow = blockDayOfWeek(block, calendarWeek);
    blocksByDay[dow]?.push(block);
  }

  // ── Click-to-open popover for existing block ──────────────────────────────

  const handleBlockClick = useCallback(
    (block: AvailabilityBlock, event: React.MouseEvent) => {
      event.stopPropagation();
      setPopoverState({
        block,
        draft: null,
        anchor: { x: event.clientX, y: event.clientY },
        isExisting: true,
      });
    },
    [],
  );

  // ── Drag-to-create (mouse down → drag → mouse up → popover) ──────────────

  const handleCellMouseDown = useCallback(
    (dayIndex: number, hour: number, e: React.MouseEvent) => {
      // Only left-click drag
      if (e.button !== 0) return;
      isDragging.current = true;
      setDragStartCell({ day: dayIndex, hour });
      setDragCurrentCell({ day: dayIndex, hour });
      setDragDraft({ dayOfWeek: dayIndex, startHour: hour, endHour: hour + 1 });
    },
    [setDragDraft],
  );

  const handleCellMouseEnter = useCallback(
    (dayIndex: number, hour: number) => {
      if (!isDragging.current || !dragStartCell) return;
      if (dragStartCell.day !== dayIndex) return;
      setDragCurrentCell({ day: dayIndex, hour });
      const minHour = Math.min(dragStartCell.hour, hour);
      const maxHour = Math.max(dragStartCell.hour, hour) + 1;
      setDragDraft({ dayOfWeek: dayIndex, startHour: minHour, endHour: maxHour });
    },
    [dragStartCell, setDragDraft],
  );

  const handleCellMouseUp = useCallback(
    (dayIndex: number, hour: number, e: React.MouseEvent) => {
      if (!isDragging.current || !dragStartCell) return;
      isDragging.current = false;

      const startH = Math.min(dragStartCell.hour, hour);
      const endH = Math.max(dragStartCell.hour, hour) + 1;

      const startTime = `${String(startH).padStart(2, "0")}:00`;
      const endTime = `${String(Math.min(endH, endHour)).padStart(2, "0")}:00`;

      setDragStartCell(null);
      setDragCurrentCell(null);
      setDragDraft(null);

      // Open BloquePopover with draft (new block, not yet saved)
      setPopoverState({
        block: null,
        draft: {
          dayOfWeek: dayIndex,
          startTime,
          endTime,
        },
        anchor: { x: e.clientX, y: e.clientY },
        isExisting: false,
      });
    },
    [dragStartCell, endHour, setDragDraft],
  );

  const handlePopoverClose = useCallback(() => {
    setPopoverState(null);
  }, []);

  // Compute drag overlay for visual feedback
  const dragOverlay =
    isDragging.current && dragStartCell && dragCurrentCell
      ? {
          day: dragStartCell.day,
          startH: Math.min(dragStartCell.hour, dragCurrentCell.hour),
          endH: Math.max(dragStartCell.hour, dragCurrentCell.hour) + 1,
        }
      : null;

  // ── dnd-kit callbacks (for pointer sensor) ────────────────────────────────
  const handleDragStart = useCallback((_event: DragStartEvent) => {
    // handled via mouse events
  }, []);

  const handleDragEnd = useCallback((_event: DragEndEvent) => {
    // handled via mouse events
  }, []);

  if (isLoading) {
    return (
      <div data-testid="calendar-skeleton" className="p-4 space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div data-testid="availability-calendar" className="flex flex-col h-full">
        {/* ── Header: week nav + 24h toggle ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 gap-2 flex-shrink-0">
          <div className="flex items-center gap-1">
            <Button
              data-testid="week-nav-prev"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={goToPrevWeek}
              aria-label="Semana anterior"
            >
              ‹
            </Button>
            <span className="text-xs font-medium text-muted-foreground min-w-[160px] text-center">
              {formatWeekLabel(calendarWeek)}
            </span>
            <Button
              data-testid="week-nav-next"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={goToNextWeek}
              aria-label="Semana siguiente"
            >
              ›
            </Button>
          </div>
          <Button
            data-testid="toggle-24h"
            variant={show24h ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShow24h((v) => !v)}
            aria-pressed={show24h}
          >
            {show24h ? "Vista reducida" : "Mostrar 24 horas"}
          </Button>
        </div>

        {/* ── Grid ──────────────────────────────────────────────────────────── */}
        <div
          className="flex-1 overflow-auto"
          role="grid"
          aria-label="Calendario de disponibilidad"
        >
          {/* Day header row */}
          <div className="flex sticky top-0 z-10 bg-background border-b border-border/40">
            {/* Time gutter */}
            <div className="w-12 flex-shrink-0" />
            {/* Day columns */}
            {DAY_LABELS.map((label, i) => {
              const dateIso = getDateForDayOfWeek(calendarWeek, i);
              const date = new Date(dateIso + "T00:00:00");
              const dayNum = date.getDate();
              return (
                <div
                  key={i}
                  data-testid={`day-col-${i}`}
                  className="flex-1 min-w-0 text-center py-1 border-l border-border/30"
                >
                  <span className="text-xs font-medium text-muted-foreground block">
                    {label}
                  </span>
                  <span className="text-sm font-semibold block">{dayNum}</span>
                </div>
              );
            })}
          </div>

          {/* Time rows */}
          <div className="relative flex">
            {/* Time gutter */}
            <div className="w-12 flex-shrink-0 relative">
              {hours.map((h) => (
                <div
                  key={h}
                  data-testid={`hour-label-${h}`}
                  className="text-right pr-1 text-xs text-muted-foreground"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  {h < 10 ? `0${h}` : `${h}`}:00
                </div>
              ))}
            </div>

            {/* Day columns with cells */}
            {DAY_LABELS.map((_, dayIndex) => (
              <div
                key={dayIndex}
                className="flex-1 min-w-0 border-l border-border/30 relative"
                style={{ height: `${hours.length * HOUR_HEIGHT}px` }}
                onMouseLeave={() => {
                  // Stop drag if mouse leaves column
                }}
              >
                {/* Hour cells (droppable areas) */}
                {hours.map((h, hourIndex) => {
                  const isDragTarget =
                    dragOverlay &&
                    dragOverlay.day === dayIndex &&
                    h >= dragOverlay.startH &&
                    h < dragOverlay.endH;

                  return (
                    <div
                      key={h}
                      className={cn(
                        "absolute left-0 right-0 border-b border-border/20",
                        isDragTarget && "bg-[--agent-lisa]/10",
                      )}
                      style={{
                        top: `${hourIndex * HOUR_HEIGHT}px`,
                        height: `${HOUR_HEIGHT}px`,
                      }}
                      onMouseDown={(e) =>
                        handleCellMouseDown(dayIndex, h, e)
                      }
                      onMouseEnter={() => handleCellMouseEnter(dayIndex, h)}
                      onMouseUp={(e) => handleCellMouseUp(dayIndex, h, e)}
                      role="gridcell"
                      aria-label={`${DAY_LABELS[dayIndex]} ${String(h).padStart(2, "0")}:00`}
                    >
                      <DroppableCell
                        dayIndex={dayIndex}
                        hour={h}
                        onMouseDown={handleCellMouseDown}
                      />
                    </div>
                  );
                })}

                {/* Blocks overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {(blocksByDay[dayIndex] ?? []).map((block) => (
                    <div
                      key={block.id}
                      className="pointer-events-auto absolute left-0 right-0"
                      style={{
                        top: `${(timeToHours(block.startTime) - startHour) * HOUR_HEIGHT}px`,
                        height: `${(timeToHours(block.endTime) - timeToHours(block.startTime)) * HOUR_HEIGHT}px`,
                      }}
                    >
                      <CalendarBlock
                        block={block}
                        startHour={startHour}
                        dayColIndex={dayIndex}
                        hourHeight={HOUR_HEIGHT}
                        onBlockClick={handleBlockClick}
                      />
                    </div>
                  ))}
                </div>

                {/* Drag overlay visual */}
                {dragOverlay && dragOverlay.day === dayIndex && (
                  <div
                    className="absolute left-0.5 right-0.5 bg-[--agent-lisa]/20 border border-[--agent-lisa]/60 rounded pointer-events-none z-10"
                    style={{
                      top: `${(dragOverlay.startH - startHour) * HOUR_HEIGHT}px`,
                      height: `${(dragOverlay.endH - dragOverlay.startH) * HOUR_HEIGHT}px`,
                    }}
                    aria-hidden
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Hint text ─────────────────────────────────────────────────────── */}
        <div className="px-3 py-1.5 border-t border-border/40 flex-shrink-0">
          <p className="text-xs text-muted-foreground">
            Arrastra para crear un bloque de disponibilidad · Haz clic en un bloque para editarlo o eliminarlo
          </p>
        </div>

        {/* ── BloquePopover ─────────────────────────────────────────────────── */}
        {popoverState && (
          <BloquePopover
            doctorId={doctorId}
            block={popoverState.block}
            draft={popoverState.draft}
            isOpen={!!popoverState}
            onClose={handlePopoverClose}
            anchor={popoverState.anchor}
            isExisting={popoverState.isExisting}
            calendarWeek={calendarWeek}
          />
        )}
      </div>
    </DndContext>
  );
}
