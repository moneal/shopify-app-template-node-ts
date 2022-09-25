import Shopify from "@shopify/shopify-api";
import type express from "express";
import { getLogger } from "../../logging";
import productCreator from "./product-creator";

export const productsCreate: express.RequestHandler = async (req, res) => {
  const session = await Shopify.Utils.loadCurrentSession(req, res, false);
  if (!session) {
    res.sendStatus(403);
    res.end();
    return;
  }

  let status = 200;
  let error: string | null = null;

  try {
    await productCreator(session);
  } catch (e: unknown) {
    status = 500;
    if (e instanceof Error) {
      getLogger(req).error(`Failed to process products/create: ${e.message}`);
      error = e.message;
    } else if (typeof e === "string") {
      error = e;
    }
  }
  res.status(status).send({ success: status === 200, error });
};
