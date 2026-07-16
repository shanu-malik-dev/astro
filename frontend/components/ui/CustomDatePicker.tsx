"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

export type DateRangeValue = {
  start: string;
  end: string;
};

type CustomDatePickerProps = {
  value?: string;
  rangeValue?: DateRangeValue;
  onChange?: (value: string) => void;
  onRangeChange?: (value: DateRangeValue) => void;
  onApply?: () => void;
  placeholder?: string;
  showTime?: boolean;
  dateRange?: boolean;
  variant?: "dark" | "light";
  className?: string;
};

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
});

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getDatePart(value?: string) {
  return value?.split("T")[0] || "";
}

function getTimePart(value?: string) {
  return value?.split("T")[1]?.slice(0, 5) || "00:00";
}

function combineDateAndTime(date: string, time: string, showTime: boolean) {
  if (!date) return "";
  return showTime ? `${date}T${time || "00:00"}` : date;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function parseMonth(value?: string) {
  const datePart = getDatePart(value);
  if (!datePart) return startOfMonth(new Date());

  const [year, month] = datePart.split("-").map(Number);
  if (!year || !month) return startOfMonth(new Date());
  return new Date(year, month - 1, 1);
}

function buildCalendarDays(month: Date) {
  const firstDay = startOfMonth(month);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function formatLabel(value?: string) {
  if (!value) return "";
  return value.replace("T", " ");
}

function formatRangeLabel(range: DateRangeValue, placeholder?: string) {
  if (!range.start && !range.end) return placeholder || "Select date";
  if (range.start && range.end) {
    return `${formatLabel(range.start)} - ${formatLabel(range.end)}`;
  }
  return formatLabel(range.start || range.end);
}

function isBetween(dateKey: string, startKey: string, endKey: string) {
  return dateKey >= startKey && dateKey <= endKey;
}

export default function CustomDatePicker({
  value = "",
  rangeValue = { start: "", end: "" },
  onChange,
  onRangeChange,
  onApply,
  placeholder,
  showTime = false,
  dateRange = false,
  variant = "light",
  className,
}: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState(rangeValue);
  const [draftValue, setDraftValue] = useState(value);
  const [visibleMonth, setVisibleMonth] = useState(
    parseMonth(rangeValue.start || value)
  );

  useEffect(() => {
    if (!open) {
      setDraftRange(rangeValue);
      setVisibleMonth(parseMonth(rangeValue.start || value));
    }
  }, [open, rangeValue, value]);

  useEffect(() => {
    if (!open) setDraftValue(value);
  }, [open, value]);

  const days = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const panelClass =
    variant === "dark"
      ? "border-white/10 bg-[#151521] text-parchment shadow-2xl"
      : "border-mist bg-white text-ink shadow-2xl";
  const buttonClass =
    variant === "dark"
      ? "h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-parchment outline-none transition hover:border-gold-light"
      : "h-10 w-full rounded-md border border-mist bg-white px-3 text-sm text-ink outline-none transition hover:border-gold";
  const mutedText = variant === "dark" ? "text-parchment/50" : "text-ink/45";
  const dateButtonBase =
    "flex h-9 w-9 items-center justify-center rounded-md text-xs transition";

  const updateRangeDate = (dateKey: string) => {
    const startKey = getDatePart(draftRange.start);
    const endKey = getDatePart(draftRange.end);
    const startTime = getTimePart(draftRange.start);
    const endTime = getTimePart(draftRange.end);

    if (!startKey || (startKey && endKey)) {
      setDraftRange({
        start: combineDateAndTime(dateKey, startTime, showTime),
        end: "",
      });
      return;
    }

    if (dateKey < startKey) {
      setDraftRange({
        start: combineDateAndTime(dateKey, startTime, showTime),
        end: combineDateAndTime(startKey, endTime, showTime),
      });
      return;
    }

    setDraftRange({
      ...draftRange,
      end: combineDateAndTime(dateKey, endTime, showTime),
    });
  };

  const updateSingleDate = (dateKey: string) => {
    setDraftValue(combineDateAndTime(dateKey, getTimePart(draftValue), showTime));
  };

  const renderCalendar = () => {
    const selectedStart = getDatePart(dateRange ? draftRange.start : draftValue);
    const selectedEnd = dateRange ? getDatePart(draftRange.end) : "";

    return (
      <>
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
            className={`rounded-md border border-mist p-1.5 transition hover:bg-parchment ${mutedText}`}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="text-sm font-semibold">
            {MONTH_FORMATTER.format(visibleMonth)}
          </p>
          <button
            type="button"
            onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
            className={`rounded-md border border-mist p-1.5 transition hover:bg-parchment ${mutedText}`}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEK_DAYS.map((day) => (
            <span key={day} className={`py-1 text-[11px] font-semibold ${mutedText}`}>
              {day}
            </span>
          ))}

          {days.map((day) => {
            const dateKey = formatDateKey(day);
            const inCurrentMonth = day.getMonth() === visibleMonth.getMonth();
            const selected = dateKey === selectedStart || dateKey === selectedEnd;
            const inRange =
              dateRange &&
              selectedStart &&
              selectedEnd &&
              isBetween(dateKey, selectedStart, selectedEnd);

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() =>
                  dateRange ? updateRangeDate(dateKey) : updateSingleDate(dateKey)
                }
                className={`${dateButtonBase} ${
                  selected
                    ? "bg-ink text-white"
                    : inRange
                      ? "bg-gold/15 text-ink"
                      : inCurrentMonth
                        ? "text-ink hover:bg-parchment"
                        : "text-ink/25 hover:bg-parchment"
                }`}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  const renderTimeFields = () => {
    if (!showTime) return null;

    if (dateRange) {
      return (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-xs font-medium">
            <span className={mutedText}>Start time</span>
            <input
              type="time"
              value={getTimePart(draftRange.start)}
              onChange={(event) =>
                setDraftRange({
                  ...draftRange,
                  start: combineDateAndTime(
                    getDatePart(draftRange.start),
                    event.target.value,
                    true
                  ),
                })
              }
              disabled={!draftRange.start}
              className="mt-1 h-9 w-full rounded-md border border-mist bg-white px-2 text-sm text-ink outline-none focus:border-gold disabled:opacity-50"
            />
          </label>
          <label className="text-xs font-medium">
            <span className={mutedText}>End time</span>
            <input
              type="time"
              value={getTimePart(draftRange.end)}
              onChange={(event) =>
                setDraftRange({
                  ...draftRange,
                  end: combineDateAndTime(
                    getDatePart(draftRange.end),
                    event.target.value,
                    true
                  ),
                })
              }
              disabled={!draftRange.end}
              className="mt-1 h-9 w-full rounded-md border border-mist bg-white px-2 text-sm text-ink outline-none focus:border-gold disabled:opacity-50"
            />
          </label>
        </div>
      );
    }

    return (
      <label className="mt-3 block text-xs font-medium">
        <span className={mutedText}>Time</span>
        <input
          type="time"
          value={getTimePart(draftValue)}
          onChange={(event) =>
            setDraftValue(
              combineDateAndTime(getDatePart(draftValue), event.target.value, true)
            )
          }
          disabled={!draftValue}
          className="mt-1 h-9 w-full rounded-md border border-mist bg-white px-2 text-sm text-ink outline-none focus:border-gold disabled:opacity-50"
        />
      </label>
    );
  };

  const clearSelection = () => {
    if (dateRange) {
      const emptyRange = { start: "", end: "" };
      setDraftRange(emptyRange);
      onRangeChange?.(emptyRange);
    } else {
      setDraftValue("");
      onChange?.("");
    }
    setOpen(false);
  };

  const applySelection = () => {
    if (dateRange) {
      onRangeChange?.(draftRange);
    } else {
      onChange?.(draftValue);
    }
    onApply?.();
    setOpen(false);
  };

  return (
    <div className={`relative ${className || ""}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`${buttonClass} flex items-center justify-between gap-2`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays size={16} className="shrink-0 text-gold-dark" />
          <span className="truncate">
            {dateRange
              ? formatRangeLabel(rangeValue, placeholder)
              : formatLabel(value) || placeholder || "Select date"}
          </span>
        </span>
      </button>

      {open && (
        <div
          className={`absolute right-0 top-12 z-[80] w-[min(92vw,340px)] rounded-lg border p-3 ${panelClass}`}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">
              {placeholder || "Select date"}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`rounded p-1 transition hover:bg-ink/5 ${mutedText}`}
              aria-label="Close calendar"
            >
              <X size={15} />
            </button>
          </div>

          {renderCalendar()}
          {renderTimeFields()}

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-md border border-mist bg-white px-3 py-2 text-xs font-medium text-ink/60 transition hover:text-ink"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={applySelection}
              className="rounded-md bg-ink px-3 py-2 text-xs font-medium text-white transition hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
