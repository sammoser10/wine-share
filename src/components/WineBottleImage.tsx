"use client";

type WineBottleImageProps = {
  imageUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "w-12 h-16",
  md: "w-16 h-22",
  lg: "w-24 h-32",
};

export function WineBottleImage({
  imageUrl,
  name,
  size = "md",
}: WineBottleImageProps) {
  if (imageUrl) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-2xl overflow-hidden border border-glass-border flex-shrink-0`}
      >
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-2xl border border-glass-border flex-shrink-0 flex items-center justify-center bg-wine/10`}
    >
      <svg
        className="w-8 h-8 text-wine-glow/40"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2C11.5 2 11 2.19 10.59 2.59L7.29 5.88C6.5 6.67 6 7.83 6 9C6 11.21 7.79 13 10 13V22H14V13C16.21 13 18 11.21 18 9C18 7.83 17.5 6.67 16.71 5.88L13.41 2.59C13 2.19 12.5 2 12 2Z" />
      </svg>
    </div>
  );
}
