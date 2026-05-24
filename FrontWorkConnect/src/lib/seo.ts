import {
  OG_IMAGE_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  absoluteUrl,
} from "./site";

type HeadMeta = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

/** Meta tags para TanStack Router `head()` — sin referencias a terceros */
export function buildPageHead(options: HeadMeta = {}) {
  const title = options.title ?? SITE_TITLE;
  const description = options.description ?? SITE_DESCRIPTION;
  const canonical = absoluteUrl(options.path ?? "/");

  return {
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title },
      { name: "description", content: description },
      { name: "author", content: SITE_NAME },
      { name: "application-name", content: SITE_NAME },
      { name: "theme-color", content: "#1e2130" },
      ...(options.noIndex ? [{ name: "robots", content: "noindex, nofollow" }] : [{ name: "robots", content: "index, follow" }]),

      // Open Graph (Facebook, WhatsApp, LinkedIn)
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "es_PE" },
      { property: "og:url", content: canonical },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: OG_IMAGE_URL },
      { property: "og:image:alt", content: SITE_TITLE },

      // Twitter / X
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: OG_IMAGE_URL },
    ],
    links: [
      { rel: "canonical", href: canonical },
      { rel: "icon", type: "image/png", href: "/isoLogo.png" },
      { rel: "apple-touch-icon", href: "/isoLogo.png" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  };
}

export { SITE_URL };
