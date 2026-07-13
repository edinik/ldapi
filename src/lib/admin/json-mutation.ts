export type Fetcher = typeof fetch;

type JsonRequestOptions = {
  method: "POST" | "PUT" | "DELETE";
  body?: unknown;
  fetcher?: Fetcher;
};

export function requestJson(url: string, { method, body, fetcher = fetch }: JsonRequestOptions) {
  return fetcher(url, {
    method,
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
}
