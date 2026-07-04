import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studytool.academy";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep authenticated app + API routes out of the index.
      disallow: [
        "/api/",
        "/auth/",
        "/account",
        "/calendar",
        "/dashboard",
        "/courses",
        "/plans",
        "/onboarding",
        "/tutorial",
        "/reset-password",
        "/verify-email",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
