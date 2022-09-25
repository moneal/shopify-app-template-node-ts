import { Card, Page, Layout, TextContainer, Heading } from "@shopify/polaris";
// import gql from "graphql-tag";
import { TitleBar } from "@shopify/app-bridge-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedFetch } from "../hooks";
import { request, gql, GraphQLClient } from "graphql-request";

const pageQuery = gql`
  query ExampleQuery {
    shop {
      name
    }
  }
`;

const Proxy = () => {
  const fetch = useAuthenticatedFetch();
  const client = new GraphQLClient("/api/graphql", { fetch: fetch });
  const { data, isLoading } = useQuery(["pageData"], async () => {
    return await client.request(pageQuery);
  });
  return (
    <Page>
      <TitleBar
        title="Proxy"
        primaryAction={{
          content: "Primary action",
          onAction: () => console.log("Primary action"),
        }}
        secondaryActions={[
          {
            content: "Secondary action",
            onAction: () => console.log("Secondary action"),
          },
        ]}
      />
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Heading>Heading</Heading>
            <TextContainer>
              <p>Body</p>
            </TextContainer>
          </Card>
          <Card sectioned>
            <Heading>Heading</Heading>
            <TextContainer>
              <p>{JSON.stringify({ isLoading, data })}</p>
            </TextContainer>
          </Card>
        </Layout.Section>
        <Layout.Section secondary>
          <Card sectioned>
            <Heading>Heading</Heading>
            <TextContainer>
              <p>Body</p>
            </TextContainer>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};
export default Proxy;
