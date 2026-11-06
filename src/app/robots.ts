import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/tools/", "/en", "/zh", "/ja", "/ko"],
        disallow: [
          "/api/",
          "/library",
          "/progress",
          "/settings",
          "/set/",
          "/login",
          "/signup",
        ],
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/tools/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/api/", "/library", "/progress", "/settings", "/set/"],
      },
      {
        userAgent: "CCBot",
        allow: ["/", "/tools/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/api/", "/library", "/progress", "/settings", "/set/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
