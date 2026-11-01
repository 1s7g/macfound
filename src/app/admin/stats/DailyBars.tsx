/**
 * A single-series bar chart of daily counts — no library, just HTML.
 *
 * One series, so no legend: the title names it. Bars use brand-600 rather than
 * the darker brand maroon, which sat outside the lightness band a filled mark
 * needs to read on the page background (checked with the dataviz validator).
 * Bars are 2px apart with rounded tops anchored to the baseline, the grid is a
 * single recessive top line, and labels stay in text colours, never the bar's.
 *
 * Each bar is a focusable button carrying its own tooltip, so the exact number
 * is a hover away on desktop and a tap away on a phone. The same numbers are in
 * a table underneath for anyone who'd rather read than squint.
 */
export function DailyBars({
  title,
  unit,
  days,
  values,
}: {
  title: string;
  /** Singular noun for tooltips: "sign-up", "post". */
  unit: string;
  days: string[];
  values: number[];
}) {
  const max = Math.max(1, ...values);
  const total = values.reduce((sum, value) => sum + value, 0);
  const label = (day: string) =>
    new Date(`${day}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  const count = (value: number) => `${value} ${unit}${value === 1 ? "" : "s"}`;

  return (
    <section className="rounded-card border border-line bg-raised p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold text-ink">{title}</h2>
        <p className="text-sm text-muted">
          {total} in {days.length} days
        </p>
      </div>

      <div className="relative mt-4">
        {/* Peak value on a single recessive gridline — enough scale to read
            the bars without an axis competing with them. */}
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-line" aria-hidden />
        <span className="absolute -top-2.5 right-0 bg-raised pl-1.5 text-xs text-subtle" aria-hidden>
          {max}
        </span>

        <ol
          className="flex h-32 items-end gap-[2px] border-b border-line-strong pt-3"
          aria-label={`${title}, last ${days.length} days`}
        >
          {values.map((value, i) => (
            <li key={days[i]} className="group relative flex h-full flex-1 items-end">
              <button
                type="button"
                aria-label={`${label(days[i])}: ${count(value)}`}
                className="flex h-full w-full items-end rounded-t-[4px] outline-offset-1 focus-visible:outline-2"
              >
                <span
                  className={`block w-full rounded-t-[4px] ${
                    value > 0 ? "bg-mf-brand-600 group-hover:bg-mf-brand-700" : ""
                  }`}
                  style={{ height: value > 0 ? `${Math.max(4, (value / max) * 100)}%` : 0 }}
                />
              </button>
              <span
                role="tooltip"
                // Anchored by position so it never runs off the screen: bars on
                // the left third open rightwards, the right third leftwards.
                className={`pointer-events-none absolute bottom-full z-10 mb-1.5 hidden whitespace-nowrap rounded-control bg-inverse px-2 py-1 text-xs text-ink-inverse shadow-raised group-hover:block group-focus-within:block ${
                  i < values.length / 3
                    ? "left-0"
                    : i >= (values.length * 2) / 3
                      ? "right-0"
                      : "left-1/2 -translate-x-1/2"
                }`}
              >
                {label(days[i])}: <strong className="font-semibold">{count(value)}</strong>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-1.5 flex justify-between text-xs text-subtle" aria-hidden>
          <span>{label(days[0])}</span>
          <span>{label(days[Math.floor(days.length / 2)])}</span>
          <span>Today</span>
        </div>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted hover:text-ink">Show as a table</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="text-xs text-subtle">
              <th className="py-1 font-medium">Day</th>
              <th className="py-1 text-right font-medium">{unit[0].toUpperCase() + unit.slice(1)}s</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {[...days].reverse().map((day, i) => (
              <tr key={day}>
                <td className="py-1 text-ink">{label(day)}</td>
                <td className="py-1 text-right tabular-nums text-ink">
                  {values[values.length - 1 - i]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
