import { Env, ChatMessage } from "./types";

// Model ID for Workers AI
const MODEL_ID = "@hf/thebloke/deepseek-coder-6.7b-instruct-awq";

// Default system prompt
const SYSTEM_PROMPT =
  "You are an expert in all things software development. Help users with coding and debugging tasks. Whatever users ask questions, you are an expert in whatever subject matter that is. Always provide concise and accurate responses.";

export default {
  /**
   * Main request handler for the Worker
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Serve static assets unless calling the chat API
    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    // Handle API routes
    if (url.pathname === "/api/chat") {
      if (request.method === "POST") {
        return handleChatRequest(request, env);
      }
      return new Response("Method not allowed", { status: 405 });
    }

    // Fallback 404
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

/**
 * Handles chat requests using Workers AI
 */
async function handleChatRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const { messages = [] } = (await request.json()) as {
      messages: ChatMessage[];
    };

    // Prepend system prompt if not included
    if (!messages.some((msg) => msg.role === "system")) {
      messages.unshift({ role: "system", content: SYSTEM_PROMPT });
    }

    const response = await env.AI.run(
      MODEL_ID,
      {
        messages,
        max_tokens: 4096,
      },
      {
        returnRawResponse: true,
        // Optional Gateway Configuration:
        // gateway: {
        //   id: "YOUR_GATEWAY_ID",
        //   skipCache: false,
        //   cacheTtl: 3600,
        // },
      },
    );

    return response;
  } catch (error) {
    console.error("❌ Error processing chat request:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
