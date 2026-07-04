import Link from "next/link";

const sizes = {
  sm: { box: "h-7 w-7 rounded-lg", icon: "h-4 w-4", text: "text-base" },
  md: { box: "h-9 w-9 rounded-xl", icon: "h-5 w-5", text: "text-lg" },
  lg: { box: "h-12 w-12 rounded-2xl", icon: "h-7 w-7", text: "text-2xl" },
} as const;

/** StudyTool wordmark: gradient rounded square with a book glyph, optional text. */
export default function Logo({
  size = "md",
  withText = true,
  href,
  className = "",
}: {
  size?: keyof typeof sizes;
  withText?: boolean;
  href?: string;
  className?: string;
}) {
  const s = sizes[size];
  const content = (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className={`bg-brand-gradient flex items-center justify-center ${s.box} shadow-sm`}>
        <svg
          className={`${s.icon} text-white`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
      </span>
      {withText && (
        <span className={`font-bold tracking-tight text-slate-900 ${s.text}`}>StudyTool</span>
      )}
    </span>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
