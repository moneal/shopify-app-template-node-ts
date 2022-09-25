import { Shopify } from "@shopify/shopify-api";
import { shopifyContextAvailable } from "./setup-shopify-context";

export const AppInstallations = {
  includes: async function (shopDomain: string) {
    if (
      // !shopifyContextAvailable() ||
      typeof Shopify === "undefined" ||
      typeof Shopify.Context === "undefined" ||
      Shopify.Context?.SESSION_STORAGE === null ||
      typeof Shopify.Context?.SESSION_STORAGE.findSessionsByShop === "undefined"
    ) {
      throw new Error("Shopify context can't find sessions by shop");
    }
    const shopSessions =
      await Shopify.Context.SESSION_STORAGE.findSessionsByShop(shopDomain);

    if (shopSessions.length > 0) {
      for (const session of shopSessions) {
        if (session.accessToken) return true;
      }
    }

    return false;
  },

  delete: async function (shopDomain: string) {
    if (
      typeof Shopify.Context.SESSION_STORAGE.findSessionsByShop === "undefined"
    ) {
      throw new Error("Shopify context can't find sessions by shop");
    }
    if (typeof Shopify.Context.SESSION_STORAGE.deleteSessions === "undefined") {
      throw new Error("Shopify context can't delete arrays of sessions");
    }
    const shopSessions =
      await Shopify.Context.SESSION_STORAGE.findSessionsByShop(shopDomain);
    if (shopSessions.length > 0) {
      await Shopify.Context.SESSION_STORAGE.deleteSessions(
        shopSessions.map((session) => session.id)
      );
    }
  },
};
