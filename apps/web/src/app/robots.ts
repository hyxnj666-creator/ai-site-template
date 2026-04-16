import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/terminal", "/terminal/"],
      },
    ],
    sitemap: "https://yoursite.example.com/sitemap.xml",
  };
}
