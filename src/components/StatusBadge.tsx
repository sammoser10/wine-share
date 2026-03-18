"use client";

type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const badgeClass =
    status === "accepted" || status === "completed"
      ? "badge-accepted"
      : status === "declined"
        ? "badge-declined"
        : status === "consumed"
          ? "badge-consumed"
          : "badge-pending";

  return (
    <span
      className={`${badgeClass} text-[11px] font-medium px-2.5 py-0.5 rounded-full`}
    >
      {status}
    </span>
  );
}
