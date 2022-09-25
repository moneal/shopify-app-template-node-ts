import type express from "express";
import { Shopify } from "@shopify/shopify-api";
import { AppInstallations } from "../helpers/app-installations";
import { join } from "path";
import redirectToAuth from "../helpers/redirect-to-auth";
import { getLogger } from "./logging";

// TODO: There should be provided by env vars
const DEV_INDEX_PATH = `${process.cwd()}/frontend/`;
const PROD_INDEX_PATH = `${process.cwd()}/frontend/dist/`;

export const frontendLoader = async (
  app: express.Application,
  { isProd = true }
) => {
  /**
   * Set the CSP header to prevent the app from being embedded in an iframe that
   * are outside of Shopify
   */
  app.use((req, res, next) => {
    // const sanitizedHost = req.query.host
    //   ? Shopify.Utils.sanitizeHost(req.query.host.toString())
    //   : false;
    // sanitizedHost &&
    //   console.log(Buffer.from(sanitizedHost, "base64").toString());
    // const hostDomain = sanitizedHost
    //   ? new URL("https://" + Buffer.from(sanitizedHost, "base64").toString())
    //       .hostname
    //   : false;
    // console.log({ hostDomain });
    const shop = req.query.shop
      ? Shopify.Utils.sanitizeShop(req.query.shop.toString())
      : false; //hostDomain;
    if (Shopify.Context.IS_EMBEDDED_APP && shop) {
      res.setHeader(
        "Content-Security-Policy",
        `frame-ancestors https://${encodeURIComponent(
          shop // || hostDomain
        )} https://admin.shopify.com;`
      );
    } else {
      res.setHeader("Content-Security-Policy", `frame-ancestors 'none';`);
    }
    next();
  });

  /**
   * Setup compression and static serving for production
   */
  if (isProd) {
    const compression = await import("compression").then(
      ({ default: fn }) => fn
    );
    const serveStatic = await import("serve-static").then(
      ({ default: fn }) => fn
    );
    const setCustomCacheControl = (res: express.Response, path: string) => {
      // Assets are immutable
      // console.log({ path });
      if (path.includes("/assets/")) {
        res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      } else if ((serveStatic.mime as any).lookup(path) === "text/html") {
        // if (serveStatic.mime.getType(path) === "text/html") {
        // Custom Cache-Control for HTML files
        res.setHeader("Cache-Control", "public, max-age=0");
      }
    };
    // Compression seems better from GCP load balancer
    app.use(compression());
    app.use(
      serveStatic(PROD_INDEX_PATH, {
        index: false,
        maxAge: "1d",
        setHeaders: setCustomCacheControl,
      })
    );
  }

  /**
   * Loads the index.html file from the frontend folder or redirects to auth
   * page if not installed
   */
  app.use("/*", async (req, res, next) => {
    if (typeof req.query.shop !== "string") {
      // Show a nicer looking error
      // const fs = await import("fs");
      // const errorPage = join(
      //   isProd ? PROD_INDEX_PATH : DEV_INDEX_PATH + "public/",
      //   "error-missing-shop.html"
      // );
      // res
      //   .status(400)
      //   .set("Content-Type", "text/html")
      //   .send(fs.readFileSync(errorPage));
      // return;
      res.status(500);
      return res.send({ error: "No shop provided" });
    }

    const shop = Shopify.Utils.sanitizeShop(req.query.shop);

    if (typeof shop !== "string") {
      res.status(500);
      return res.send("Invalid shop provided");
    }

    const appInstalled = await AppInstallations.includes(shop);

    if (!appInstalled) {
      getLogger(req).info({ labels: { shop } }, `Redirecting to auth`);
      return redirectToAuth(req, res, app);
    }

    if (Shopify.Context.IS_EMBEDDED_APP && req.query.embedded !== "1") {
      getLogger(req).info({ labels: { shop } }, `Redirecting to embedded`);
      const embeddedUrl = Shopify.Utils.getEmbeddedAppUrl(req);
      return res.redirect(embeddedUrl + req.path);
    }

    getLogger(req).info({ labels: { shop } }, `Serving app`);
    const fs = await import("fs");
    const fallbackFile = join(
      isProd ? PROD_INDEX_PATH : DEV_INDEX_PATH,
      "index.html"
    );
    res
      .status(200)
      .set("Content-Type", "text/html")
      .send(fs.readFileSync(fallbackFile));
  });
};
