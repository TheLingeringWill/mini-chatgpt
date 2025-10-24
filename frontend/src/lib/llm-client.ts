// T012: LLM client with retry logic, timeout, and exponential backoff

const MAX_RETRIES = 3;
const TIMEOUT_MS = 12000; // 12 seconds
const INITIAL_BACKOFF_MS = 1000; // 1 second

/**
 * Send a message to the LLM API with retry logic and timeout
 *
 * @param message - The user's message content
 * @param signal - AbortSignal for cancellation
 * @returns The LLM's response text
 * @throws Error with user-friendly message on failure
 */
export async function sendMessage(
  message: string,
  signal: AbortSignal
): Promise<string> {
  let retries = 0;

  while (retries <= MAX_RETRIES) {
    try {
      const response = await fetchWithTimeout(
        "/api/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
          signal,
        },
        TIMEOUT_MS
      );

      const data = await response.json();

      if (response.ok) {
        return data.completion;
      }

      // Retry only on 500 errors
      if (response.status === 500 && retries < MAX_RETRIES) {
        retries++;
        const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, retries - 1);
        console.log(`Retry ${retries}/${MAX_RETRIES} after ${backoffMs}ms...`);
        await delay(backoffMs);
        continue;
      }

      // Non-retryable error
      throw new Error(data.error || "Request failed");
    } catch (error) {
      // Handle abort
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request cancelled");
      }

      // Handle timeout
      if (error instanceof Error && error.message === "Timeout") {
        throw new Error("Request timed out after 12 seconds. Please try again.");
      }

      // Retry on network errors
      if (retries < MAX_RETRIES) {
        retries++;
        const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, retries - 1);
        console.log(`Retry ${retries}/${MAX_RETRIES} after ${backoffMs}ms due to error:`, error);
        await delay(backoffMs);
        continue;
      }

      // Max retries exceeded
      throw error;
    }
  }

  throw new Error("Max retries exceeded");
}

/**
 * Fetch with timeout using Promise.race
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeout)
    ),
  ]);
}

/**
 * Delay helper for exponential backoff
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
