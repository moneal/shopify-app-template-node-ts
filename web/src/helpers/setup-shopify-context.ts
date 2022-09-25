import { Shopify, LATEST_API_VERSION } from "@shopify/shopify-api";
// import { FirebaseSessionStore } from "./firestore-session";

export const shopifyContextAvailable = () => {
  return typeof Shopify !== "undefined";
};

export const setupShopifyContext = () => {
  if (!process.env.SHOPIFY_API_KEY) {
    throw new Error("Environment variable SHOPIFY_API_KEY is not set");
  }
  if (!process.env.SHOPIFY_API_SECRET) {
    throw new Error("Environment variable SHOPIFY_API_SECRET is not set");
  }
  if (!process.env.SCOPES) {
    throw new Error("Environment variable SCOPES is not set");
  }
  if (!process.env.HOST) {
    throw new Error("Environment variable HOST is not set");
  }

  // const sessionStorage = new FirebaseSessionStore();
  Shopify.Context.initialize({
    API_KEY: process.env.SHOPIFY_API_KEY,
    API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
    SCOPES: process.env.SCOPES.split(","),
    HOST_NAME: process.env.HOST.replace(/https?:\/\//, ""),
    HOST_SCHEME: process.env.HOST.split("://")[0],
    API_VERSION: LATEST_API_VERSION,
    IS_EMBEDDED_APP: true,
    // This should be replaced with your preferred storage strategy
    // SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
    SESSION_STORAGE: new Shopify.Session.SQLiteSessionStorage(
      `${process.cwd()}/database.sqlite`
    ),
    // SESSION_STORAGE: new Shopify.Session.CustomSessionStorage(
    //   sessionStorage.storeCallback.bind(sessionStorage),
    //   sessionStorage.loadCallback.bind(sessionStorage),
    //   sessionStorage.deleteCallback.bind(sessionStorage),
    //   sessionStorage.deleteSessionsCallback.bind(sessionStorage),
    //   sessionStorage.findSessionsByShopCallback.bind(sessionStorage)
    // ),
    LOG_FILE: "shopify-api.log",
    // SESSION_STORAGE: new Shopify.Session.SQLiteSessionStorage(DB_PATH),
  });
};
