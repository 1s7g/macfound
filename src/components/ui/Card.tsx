import type { ReactNode } from "react";

export function Card({
  as: Tag = "div",
  interactive,
  className,
  children,
}: {
  as?: "div" | "li" | "article" | "section";
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={[
        "rounded-card border border-line bg-raised",
        interactive
          ? "transition-all duration-150 hover:border-line-strong hover:shadow-raised"
          : "shadow-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}
