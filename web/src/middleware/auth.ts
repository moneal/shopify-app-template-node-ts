import { Shopify } from "@shopify/shopify-api";
import { gdprTopics } from "@shopify/shopify-api/dist/webhooks/registry.js";
import type express from "express";
import cookieParser from "cookie-parser";

import topLevelAuthRedirect from "../helpers/top-level-auth-redirect";

export const applyAuthMiddleware = (
  app: express.Application,
  { billing = { required: false } } = { billing: { required: false } }
) => {
  app.use(cookieParser(Shopify.Context.API_SECRET_KEY));
  app.get("/api/auth", async (req, res) => {
    const shop = Shopify.Utils.sanitizeShop(`${req.query.shop}`);
    if (!shop) {
      res.status(500);
      return res.send("No shop provided");
    }

    if (!req.signedCookies[app.get("top-level-oauth-cookie")]) {
      return res.redirect(
        `/api/auth/toplevel?shop=${encodeURIComponent(shop)}`
      );
    }

    const redirectUrl = await Shopify.Auth.beginAuth(
      req,
      res,
      shop,
      "/api/auth/callback",
      app.get("use-online-tokens")
    );

    res.redirect(redirectUrl);
  });

  app.get("/api/auth/toplevel", (req, res) => {
    const shop = Shopify.Utils.sanitizeShop(`${req.query.shop}`);
    if (!shop) {
      res.status(500);
      return res.send("No shop provided");
    }

    res.cookie(app.get("top-level-oauth-cookie"), "1", {
      signed: true,
      httpOnly: true,
      sameSite: "strict",
    });

    res.set("Content-Type", "text/html");

    res.send(
      topLevelAuthRedirect({
        apiKey: Shopify.Context.API_KEY,
        hostName: Shopify.Context.HOST_NAME,
        shop: shop,
      })
    );
  });

  app.get("/api/auth/callback", async (req, res) => {
    try {
      const session = await Shopify.Auth.validateAuthCallback(
        req,
        res,
        req.query as {
          shop: string;
          code: string;
          timestamp: string;
          state: string;
        }
      );

      const host = Shopify.Utils.sanitizeHost(`${req.query.host}`, true);

      const responses = await Shopify.Webhooks.Registry.registerAll({
        shop: session.shop,
        accessToken: session.accessToken as string,
      });

      Object.entries(responses).map(([topic, response]) => {
        // The response from registerAll will include errors for the GDPR topics.  These can be safely ignored.
        // To register the GDPR topics, please set the appropriate webhook endpoint in the
        // 'GDPR mandatory webhooks' section of 'App setup' in the Partners Dashboard.
        if (!response.success && !gdprTopics.includes(topic)) {
          console.log(
            `Failed to register ${topic} webhook: ${
              (
                response as {
                  result: {
                    errors: { message: string }[];
                  };
                }
              ).result.errors[0].message
            }`
          );
        }
      });

      let redirectUrl = `/?shop=${encodeURIComponent(
        session.shop
      )}&host=${encodeURIComponent(host || "")}`;

      // Redirect to app with shop parameter upon auth
      res.redirect(redirectUrl);
    } catch (e) {
      console.warn(e);
      switch (true) {
        case e instanceof Shopify.Errors.InvalidOAuthError:
          res.status(400);
          res.send((e as any).message);
          break;
        case e instanceof Shopify.Errors.CookieNotFound:
        case e instanceof Shopify.Errors.SessionNotFound:
          // This is likely because the OAuth session cookie expired before the merchant approved the request
          const shop = Shopify.Utils.sanitizeShop(`${req.query.shop}`);
          if (!shop) {
            res.status(500);
            return res.send("No shop provided");
          }

          res.redirect(`/api/auth?shop=${encodeURIComponent(shop)}`);
          break;
        default:
          res.status(500);
          res.send((e as any).message);
          break;
      }
    }
  });
};
