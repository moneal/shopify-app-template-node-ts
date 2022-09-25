import type express from "express";
import Shopify from "@shopify/shopify-api";
import { getLogger } from "../logging";
import { HttpResponseError } from "@shopify/shopify-api/dist/error";

export const graphqlProxy: express.RequestHandler = async (req, res) => {
  // return Shopify.Utils.graphqlProxy(req, res);
  // Kinda pointless...
  const session = await Shopify.Utils.loadCurrentSession(req, res, false);
  // const authHeader = req.headers.authorization;
  if (!session || !session.accessToken) {
    res.sendStatus(403);
    res.end();
    return;
  }
  try {
    const client = new Shopify.Clients.Graphql(
      session.shop,
      session.accessToken
    );
    // So no idea if this is really the request I wrote. Would be great to have a signed request system...
    const { body } = await client.query({
      data: req.body,
    });
    const { operationName } = req.body;
    const {
      extensions: { cost },
    } = body as any;
    const { throttleStatus, ...costs } = cost;
    const status = Object.fromEntries(
      Object.entries(throttleStatus).map(([key, value]) => {
        return [`throttle${key.charAt(0).toUpperCase()}${key.slice(1)}`, value];
      })
    );
    getLogger(req).info({ labels: { operationName, ...costs, ...status } });
    res.send(body);
  } catch (e) {
    res.status(500);
    const logger = getLogger(req);
    logger.error(e);
    if (e instanceof Shopify.Errors.GraphqlQueryError) {
      const { errors } = e.response;
      logger.error("Graphql Query Error", errors);
      console.dir({ errors }, { depth: 4 });
    }
    if (e instanceof HttpResponseError) {
      const { body } = e.response;
      const { errors } = body as any;
      console.dir(errors);
    }
    res.end();
  }
};
