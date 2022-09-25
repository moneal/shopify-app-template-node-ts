// import {
//   QueryClient,
//   QueryClientProvider,
//   QueryCache,
//   MutationCache,
// } from "react-query";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { useAuthenticatedFetch } from "../../hooks";

/**
 * Sets up the QueryClientProvider from react-query.
 * @desc See: https://react-query.tanstack.com/reference/QueryClientProvider#_top
 */
export const QueryProvider: React.FC<{
  children?: React.ReactNode;
}> = ({ children }) => {
  const client = new QueryClient({
    queryCache: new QueryCache(),
    mutationCache: new MutationCache(),
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
