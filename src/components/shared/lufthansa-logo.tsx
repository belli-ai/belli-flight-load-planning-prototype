import { cn } from "@/lib/utils";

interface LufthansaLogoProps {
  className?: string;
  variant?: "default" | "yellow" | "blue" | "white";
}

export function LufthansaLogo({ className, variant = "default" }: LufthansaLogoProps) {
  const colorClass = {
    default: "text-current",
    yellow: "text-accent",
    blue: "text-primary",
    white: "text-white",
  }[variant];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn("fill-current stroke-current", colorClass, className)}
    >
      {/* Lufthansa Crane Logo */}
      {/* Outer Circle */}
      <circle cx="50" cy="50" r="46" fill="none" strokeWidth="3" />

      {/* Crane Bird - Stylized */}
      <g className="fill-current stroke-none">
        {/* Body and tail */}
        <path d="M22 62
                 C24 58, 28 54, 34 50
                 C38 47, 42 44, 46 42
                 C50 40, 54 38, 58 36
                 C64 33, 70 30, 78 26
                 C74 30, 70 34, 66 38
                 C62 42, 58 46, 54 50
                 C50 54, 46 58, 42 62
                 C38 66, 34 69, 30 71
                 C26 68, 24 65, 22 62Z" />

        {/* Head */}
        <circle cx="78" cy="26" r="3" />

        {/* Wing accent */}
        <path d="M48 44
                 C52 42, 56 40, 60 38
                 C62 42, 60 46, 56 48
                 C52 50, 48 48, 48 44Z" />
      </g>
    </svg>
  );
}

export function LufthansaCargoLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 60"
      className={cn(className)}
    >
      {/* Crane Symbol in Circle - Dark Blue */}
      <g>
        <circle cx="30" cy="30" r="22" fill="none" stroke="#05164D" strokeWidth="2.5" />
        <g fill="#05164D">
          {/* Simplified crane bird */}
          <path d="M15 35
                   C16 33, 18 31, 21 29
                   C23 27.5, 25 26, 27 25
                   C29 24, 31 23, 33 22
                   C36 20.5, 39 19, 42 17
                   C40 19, 38 21, 36 23
                   C34 25, 32 27, 30 29
                   C28 31, 26 33, 24 35
                   C22 37, 20 38.5, 18 39.5
                   C16 38, 15 36.5, 15 35Z" />
          <circle cx="42" cy="17" r="2" />
          {/* Wing detail */}
          <path d="M28 26
                   C30 25, 32 24, 34 23
                   C35 25, 34 27, 32 28
                   C30 29, 28 28, 28 26Z" />
        </g>
      </g>

      {/* "Lufthansa Cargo" Text - All in one line, bold, dark blue */}
      <text x="65" y="38" fontSize="24" fontWeight="700" fontFamily="Arial, Helvetica, sans-serif" fill="#05164D" letterSpacing="-0.5">
        Lufthansa Cargo
      </text>
    </svg>
  );
}
