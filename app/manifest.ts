import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "마음이음",
    short_name: "마음이음",
    description: "비슷한 마음을 가진 사람들과 부담 없이 이어지는 곳",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#FAF6EF",
    theme_color: "#FAF6EF",
    lang: "ko",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
