import { Shopify } from "@shopify/shopify-api";
// import ensureBilling, {
//   ShopifyBillingError,
// } from "../../helpers/ensure-billing";
import type express from "express";

import { returnTopLevelRedirection } from "../../helpers";
import { getLogger } from "../logging";

const TEST_GRAPHQL_QUERY = `
{
  shop {
    name
    plan {
			displayName
			partnerDevelopment
			shopifyPlus
		}
  }
}`;

export const verifyRequest = (
  // app,
  {
    billing = { required: false },
    isOnlineSession = false,
  }: {
    billing?: { required: boolean };
    isOnlineSession?: boolean;
  } = {
    billing: { required: false },
    isOnlineSession: false,
  }
): express.RequestHandler => {
  return async (req, res, next) => {
    let session;
    try {
      session = await Shopify.Utils.loadCurrentSession(
        req,
        res,
        isOnlineSession
      );
    } catch (err) {
      if (err instanceof Shopify.Errors.InvalidJwtError) {
        console.warn("Invalid JWT in request. Expired, wrong domain, etc...");
      } else {
        console.error(err);
      }
      return returnTopLevelRedirection(req, res, "/auth");
    }

    let shop = Shopify.Utils.sanitizeShop(`${req.query.shop}`);
    if (session && shop && session.shop !== shop) {
      // The current request is for a different shop. Redirect gracefully.
      return res.redirect(`/api/auth?shop=${encodeURIComponent(shop)}`);
    }

    if (session?.isActive()) {
      try {
        if (false && billing.required) {
          // // The request to check billing status serves to validate that the access token is still valid.
          // const [hasPayment, confirmationUrl] = await ensureBilling(
          //   session,
          //   billing
          // );
          // if (!hasPayment) {
          //   returnTopLevelRedirection(req, res, confirmationUrl);
          //   return;
          // }
        } else {
          // Make a request to ensure the access token is still valid. Otherwise, re-authenticate the user.
          const client = new Shopify.Clients.Graphql(
            session.shop,
            session.accessToken
          );
          const { body, headers } = await client.query({
            data: TEST_GRAPHQL_QUERY,
          });
          const { data, extensions } = body as {
            data: any;
            extensions: unknown;
          };
          const { shop } = data;
          const { displayName } = shop.plan;
          getLogger(req).info(
            {
              labels: { shop: session.shop, planName: displayName },
            },
            "Request verified"
          );
        }
        return next();
      } catch (e) {
        if (
          e instanceof Shopify.Errors.HttpResponseError &&
          e.response.code === 401
        ) {
          // Re-authenticate if we get a 401 response
          // } else if (e instanceof ShopifyBillingError) {
          //   console.error(e.message, e.errorData[0]);
          //   res.status(500).end();
          //   return;
        } else {
          throw e;
        }
      }
    }

    const bearerPresent = req.headers.authorization?.match(/Bearer (.*)/);
    if (bearerPresent) {
      if (!shop) {
        if (session) {
          shop = session.shop;
        } else if (Shopify.Context.IS_EMBEDDED_APP) {
          if (bearerPresent) {
            const payload = Shopify.Utils.decodeSessionToken(bearerPresent[1]);
            shop = payload.dest.replace("https://", "");
          }
        }
      }
    }

    returnTopLevelRedirection(
      req,
      res,
      `/api/auth?shop=${encodeURIComponent(shop || "")}`
    );
  };
};
