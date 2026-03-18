export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function getVenmoDeepLink(
  username: string,
  amount: number,
  note: string
): string {
  const encodedNote = encodeURIComponent(note);
  return `venmo://paycharge?txn=pay&recipients=${username}&amount=${amount.toFixed(2)}&note=${encodedNote}`;
}

export function getVenmoWebLink(
  username: string,
  amount: number,
  note: string
): string {
  const encodedNote = encodeURIComponent(note);
  return `https://venmo.com/${username}?txn=pay&amount=${amount.toFixed(2)}&note=${encodedNote}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function timeAgo(date: string): string {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000
  );
  const intervals = [
    { label: "y", seconds: 31536000 },
    { label: "mo", seconds: 2592000 },
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "m", seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count}${interval.label} ago`;
  }
  return "just now";
}
