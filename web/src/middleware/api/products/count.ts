import Shopify, {
  GraphqlWithSession,
  RestRequestReturn,
  RestWithSession,
  WithSessionParams,
} from "@shopify/shopify-api";
import type express from "express";
export const productsCount: express.RequestHandler = async (req, res) => {
  // const clientWithSessionParams: WithSessionParams = {
  //   clientType: "rest",
  //   isOnline: true,
  //   req: req, // http.IncomingMessage object
  //   res: res, // http.ServerResponse object
  // };

  // const { client, session } = (await Shopify.Utils.withSession(
  //   clientWithSessionParams
  // )) as RestWithSession;
  const session = await Shopify.Utils.loadCurrentSession(req, res, false);
  const { Product } = await import(
    `@shopify/shopify-api/dist/rest-resources/${Shopify.Context.API_VERSION}/index.js`
  );
  // const products = await client.get({ path: "products" });

  const countData = await Product.count({ session });
  res.status(200).send(countData);
};
