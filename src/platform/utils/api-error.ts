export class ApiResponseError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function parseApiError(response: Response, fallback: string): Promise<never> {
  let message = fallback;
  let code = "UNKNOWN";

  try {
    const data = await response.json();
    if (data.error) message = data.error;
    if (data.code) code = data.code;
  } catch {
    // Response wasn't JSON, use fallback
  }

  throw new ApiResponseError(message, code, response.status);
}
