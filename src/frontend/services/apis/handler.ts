import { fetchAuthSession } from "aws-amplify/auth";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { HTTP_API_URL, IS_OFFLINE } from "@config";

const TOKEN_EXPIRY_MINUTES = 5;
const API_BASE_URL = IS_OFFLINE ? "" : HTTP_API_URL;

let accessToken: string | null = null;
let tokenFetchTime: Date | null = null;

/**
 * Gets a valid access token, fetching a new one if expired or not available
 * @returns {Promise<string>} The valid access token
 */
async function getAccessToken(): Promise<string> {
  const now = new Date();
  const isTokenExpired =
    !accessToken ||
    !tokenFetchTime ||
    now.getTime() - tokenFetchTime.getTime() > TOKEN_EXPIRY_MINUTES * 60 * 1000;

  if (isTokenExpired) {
    try {
      const { idToken } =
        (await fetchAuthSession({ forceRefresh: true })).tokens || {};
      accessToken = idToken ? idToken.toString() : null;
      tokenFetchTime = now;
    } catch (error) {
      console.error("Error fetching auth session:", error);
      throw new Error("Authentication required");
    }
  }

  return accessToken!;
}

/**
 * Formats API URLs consistently
 * @param {string} path - Relative path or full URL
 * @param {Record<string, string>} [pathParams={}] - Path parameters to replace in the URL
 * @param {Record<string, string | number | boolean | null>} [queryParams={}] - Query parameters to append to the URL
 * @param {boolean} [cacheBust=false] - Whether to add cache-busting param
 * @returns {string} Formatted URL
 */
function formatApiUrl(
  path: string,
  pathParams: Record<string, string> = {},
  queryParams: Record<string, string | number | boolean | null> = {},
  cacheBust: boolean = false
): string {
  let formattedPath = path;
  Object.entries(pathParams).forEach(([key, value]) => {
    formattedPath = formattedPath.replace(`:${key}`, encodeURIComponent(value));
  });

  const isFullUrl =
    formattedPath.startsWith("http://") || formattedPath.startsWith("https://");
  let url = isFullUrl ? formattedPath : `${API_BASE_URL}${formattedPath}`;

  const searchParams = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });
  if (cacheBust) {
    searchParams.append("_", Date.now().toString());
  }
  const queryString = searchParams.toString();
  if (queryString) {
    url += (url.includes("?") ? "&" : "?") + queryString;
  }

  return url;
}

/**
 * Handles API responses consistently
 * @param {Response} response - Fetch API response
 * @param {Object} [options] - Response handling options
 * @param {boolean} [options.isText] - Force response as text
 * @returns {Promise<any>} Parsed response data
 * @throws {Error} For failed requests
 */
async function handleResponse(
  response: Response,
  { isText = false }: { isText?: boolean } = {}
): Promise<any> {
  if (response.status === StatusCodes.UNAUTHORIZED) {
    accessToken = null;
    tokenFetchTime = null;
    const error = new Error("Authentication required");
    (error as any).status = response.status;
    throw error;
  }

  if (!response.ok) {
    const reasonPhrase = getReasonPhrase(response.status);
    const error = new Error(`API request failed: ${reasonPhrase}`);
    (error as any).status = response.status;
    (error as any).message = reasonPhrase;

    throw error;
  }

  if (isText) {
    return response.text();
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  if (
    text.trim().startsWith("<!DOCTYPE html>") ||
    text.trim().startsWith("<html")
  ) {
    console.error(
      "Received HTML response instead of expected data format:",
      text.substring(0, 100) + "..."
    );
    return null;
  }
  return text;
}

/**
 * Makes a POST request with JSON body
 * @param {string} url - API endpoint URL
 * @param {Object} [body={}] - Request body data (object or string)
 * @param {Record<string, string>} [headers={}] - Additional headers
 * @param {Object} [options={}] - Internal API options
 * @param {boolean} [options.cacheBust=false] - Whether to add cache-busting param
 * @param {boolean} [options.isText] - Whether to force text response
 * @returns {Promise<any>} Parsed response data
 */
export async function postJson(
  url: string,
  body: Record<string, any> | string = {},
  headers: Record<string, string> = {},
  options: { cacheBust?: boolean; isText?: boolean } = {}
): Promise<any> {
  const formattedUrl = formatApiUrl(url, {}, {}, options.cacheBust);

  const fetchOptions: RequestInit = {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: await getAccessToken(),
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  };
  const response = await fetch(formattedUrl, fetchOptions);
  return await handleResponse(response, options);
}

/**
 * Makes a GET request and parses the JSON response
 * @param {string} url - API endpoint URL
 * @param {Record<string, string>} [pathParams={}] - Path parameters
 * @param {Record<string, string | number | boolean | null>} [queryParams={}] - Query parameters
 * @param {Record<string, string>} [headers={}] - Additional headers
 * @param {Object} [options={}] - Internal API options
 * @param {boolean} [options.cacheBust=false] - Whether to add cache-busting param
 * @returns {Promise<any>} Parsed response data
 */
export async function getJson(
  url: string,
  pathParams: Record<string, string> = {},
  queryParams: Record<string, string | number | boolean | null> = {},
  headers: Record<string, string> = {},
  options: { cacheBust?: boolean; isText?: boolean } = {}
): Promise<any> {
  const formattedUrl = formatApiUrl(
    url,
    pathParams,
    queryParams,
    options.cacheBust
  );

  const fetchOptions: RequestInit = {
    method: "GET",
    credentials: "include",
    headers: {
      Authorization: await getAccessToken(),
      ...headers,
    },
  };
  const response = await fetch(formattedUrl, fetchOptions);
  return await handleResponse(response, options);
}
