import type { ComponentProps, ReactNode } from "react";

/**
 * Form field chrome: label, hint, error.
 *
 * The hint disappears when there's an error rather than stacking below it —
 * two lines of grey advice under a red message buries the thing that needs
 * reading.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs leading-relaxed text-subtle">{hint}</p>
      )}
    </div>
  );
}

/*
 * Focus is left to the global :focus-visible ring in globals.css rather than
 * recoloured here. These controls used to do both — suppress the ring with
 * `outline-none` and turn the border maroon — but an unlayered global rule
 * beats a Tailwind utility whatever its specificity, so the suppression never
 * applied and a focused field drew two concentric maroon edges.
 */
const CONTROL =
  "w-full rounded-control border bg-raised px-3.5 text-ink transition-colors " +
  "placeholder:text-subtle";

function controlClass(invalid?: boolean, extra?: string) {
  return [
    CONTROL,
    invalid ? "border-danger" : "border-line-strong",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Input({
  invalid,
  className,
  ...props
}: ComponentProps<"input"> & { invalid?: boolean }) {
  return <input className={controlClass(invalid, `h-10 ${className ?? ""}`)} {...props} />;
}

export function Textarea({
  invalid,
  className,
  ...props
}: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea className={controlClass(invalid, `py-2.5 ${className ?? ""}`)} {...props} />
  );
}

export function Select({
  invalid,
  className,
  children,
  ...props
}: ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <select className={controlClass(invalid, `h-10 ${className ?? ""}`)} {...props}>
      {children}
    </select>
  );
}
