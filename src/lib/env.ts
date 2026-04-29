/**
 * Central environment reader.
 * Never throws at import time — missing creds just degrade an adapter to stub.
 */
export const env = {
  ebay: {
    appId: process.env.EBAY_APP_ID ?? "",
    certId: process.env.EBAY_CERT_ID ?? "",
    epnCampaignId: process.env.EBAY_EPN_CAMPAIGN_ID ?? "",
    get configured() {
      return Boolean(this.appId && this.certId)
    },
  },
  cardmarket: {
    appToken: process.env.CARDMARKET_APP_TOKEN ?? "",
    appSecret: process.env.CARDMARKET_APP_SECRET ?? "",
    accessToken: process.env.CARDMARKET_ACCESS_TOKEN ?? "",
    accessTokenSecret: process.env.CARDMARKET_ACCESS_TOKEN_SECRET ?? "",
    get configured() {
      return Boolean(
        this.appToken && this.appSecret && this.accessToken && this.accessTokenSecret,
      )
    },
  },
  adapter: {
    minIntervalSec: Number(process.env.ADAPTER_MIN_INTERVAL_SEC ?? 2),
    timeoutMs: Number(process.env.ADAPTER_TIMEOUT_MS ?? 8000),
    demoFallback: (process.env.ADAPTER_DEMO_FALLBACK ?? "true") !== "false",
  },
} as const
