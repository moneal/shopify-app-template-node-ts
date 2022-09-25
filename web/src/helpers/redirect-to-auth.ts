import { Shopify } from "@shopify/shopify-api";
import type express from "express";
const redirectToAuth = async (
  req: express.Request,
  res: express.Response,
  app: express.Application
) => {
  if (!req.query.shop) {
    res.status(500);
    return res.send("No shop provided");
  }

  if (req.query.embedded === "1") {
    return clientSideRedirect(req, res);
  }

  return await serverSideRedirect(req, res, app);
};
export default redirectToAuth;

const clientSideRedirect = (req: express.Request, res: express.Response) => {
  const shop = Shopify.Utils.sanitizeShop(req.query.shop as string) as string;
  const redirectUriParams = new URLSearchParams({
    shop,
    host: req.query.host as string,
  }).toString();
  const queryParams = new URLSearchParams({
    ...req.query,
    shop,
    redirectUri: `https://${Shopify.Context.HOST_NAME}/api/auth?${redirectUriParams}`,
  }).toString();

  return res.redirect(`/exitiframe?${queryParams}`);
};

const serverSideRedirect = async (
  req: express.Request,
  res: express.Response,
  app: express.Application
) => {
  const redirectUrl = await Shopify.Auth.beginAuth(
    req,
    res,
    req.query.shop as string,
    "/api/auth/callback",
    app.get("use-online-tokens")
  );

  return res.redirect(redirectUrl);
};
