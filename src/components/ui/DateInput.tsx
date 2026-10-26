"use client";

import { useState, type ComponentProps } from "react";

import { CalendarGlyph, Icon } from "@/components/icons";
import { Input } from "./Field";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * "2026-10-25" → "Sun, Oct 25, 2026". Spelled out by hand rather than with
 * toLocaleDateString, which formats differently on the server and in Safari
 * and would make the first render disagree with hydration.
 */
function formatDate(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  const date = new Date(y, m - 1, d);
  return `${DAYS[date.getDay()]}, ${MONTHS[m - 1]} ${d}, ${y}`;
}

/**
 * A date field that looks right on an iPhone.
 *
 * Safari's native date control can't be restyled reliably: it keeps an
 * intrinsic width that pushes past its column, lays out its own icon and
 * padding, and ignores most of what CSS asks of it. So on phones the field you
 * see is ours — the formatted date and a calendar icon, styled like every other
 * input — and the real <input type="date"> sits on top of it, invisible.
 * Tapping anywhere still opens the phone's own date picker, and the form still
 * submits the real input's value. Desktop shows the native control as before.
 */
export function DateInput({
  value,
  defaultValue,
  onChange,
  invalid,
  className,
  ...props
}: ComponentProps<typeof Input>) {
  // Mirrors the input so the visible label can follow it when the caller
  // leaves the field uncontrolled (the edit form does).
  const [inner, setInner] = useState(String(defaultValue ?? ""));
  const current = value !== undefined ? String(value) : inner;

  return (
    <div className="relative rounded-control has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-brand md:has-[input:focus-visible]:outline-none">
      <div
        aria-hidden
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-control border bg-raised px-3.5 text-base md:hidden ${
          invalid ? "border-danger" : "border-line-strong"
        }`}
      >
        <span className={current ? "text-ink" : "text-subtle"}>
          {current ? formatDate(current) : "Pick a date"}
        </span>
        <Icon className="h-5 w-5 text-muted">
          <CalendarGlyph />
        </Icon>
      </div>

      <Input
        type="date"
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={(event) => {
          setInner(event.target.value);
          onChange?.(event);
        }}
        invalid={invalid}
        className={`phone:absolute phone:inset-0 phone:h-full phone:w-full phone:opacity-0 ${className ?? ""}`}
        {...props}
      />
    </div>
  );
}
