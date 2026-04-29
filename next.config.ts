import type { NextConfig } from "next"

const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.ebayimg.com" },
      { protocol: "https", hostname: "images.vinted.net" },
      { protocol: "https", hostname: "images1.vinted.net" },
      { protocol: "https", hostname: "images2.vinted.net" },
      { protocol: "https", hostname: "cdn.wallapop.com" },
      { protocol: "https", hostname: "images.sbito.it" },
      { protocol: "https", hostname: "s.sbito.it" },
    ],
  },
}

export default config
