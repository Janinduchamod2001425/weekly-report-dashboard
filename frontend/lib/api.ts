const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | object | null;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  let requestBody = options.body;

  const shouldSerializeBody =
    requestBody !== null &&
    requestBody !== undefined &&
    typeof requestBody === "object" &&
    !(requestBody instanceof FormData) &&
    !(requestBody instanceof URLSearchParams) &&
    !(requestBody instanceof Blob) &&
    !(requestBody instanceof ArrayBuffer);

  if (shouldSerializeBody) {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify(requestBody);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: requestBody as BodyInit | null | undefined,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") ?? "";

  const responseData = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const message =
      responseData &&
      typeof responseData === "object" &&
      "message" in responseData
        ? Array.isArray(responseData.message)
          ? responseData.message.join(", ")
          : String(responseData.message)
        : "Something went wrong";

    throw new ApiError(response.status, message, responseData);
  }

  return responseData as T;
}
