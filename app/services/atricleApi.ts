import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const apyHubApiKey = "YOUR_APYHUB_API_KEY"; // Replace with your actual APYHub API key

export const articleApi = createApi({
  reducerPath: "articleApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://api.apyhub.com/ai",
    prepareHeaders: (headers) => {
      headers.set("apy-token", apyHubApiKey);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getSummary: builder.query({
      query: (params) => ({
        url: "/summarize-url",
        method: "POST",
        body: { url: params.articleUrl },
      }),
      transformResponse: (response) => response.data.summary || "No summary available.",
    }),
  }),
});

export const { useLazyGetSummaryQuery } = articleApi;
