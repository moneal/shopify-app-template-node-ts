import { useSearchParams } from "react-router-dom";

export const useQueryParam = (
  key: string,
  defaultVal?: string
): [string | undefined, (val: string) => void] => {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key) || defaultVal;
  const updateFunction = (value: string) => {
    searchParams.set(key, value);
    const search = searchParams.toString();
    setSearchParams(search);
  };
  return [value, updateFunction];
};
