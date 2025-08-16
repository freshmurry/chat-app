/**
 * LLM Chat Application Template
 *
 * A simple chat application using Cloudflare Workers AI.
 * This template demonstrates how to implement an LLM-powered chat interface with
 * streaming responses using Server-Sent Events (SSE).
 *
 * @license MIT
 */
import { Env, ChatMessage } from "./types";

// Model ID for Workers AI model
// https://developers.cloudflare.com/workers-ai/models/
// const MODEL_ID = "@cf/meta/llama-.-b-instruct-fp-fast";
// const MODEL_ID = "@cf/meta/llama--scout-b-e-instruct";
const MODEL_ID = "@cf/openai/gpt-oss-120b";

// Default system prompt
const SYSTEM_PROMPT =
  "You are an expert in many things. Whatever users ask questions, you are an expert in whatever subject matter that is. Always provide concise and accurate responses.";

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

    // Handle static assets (frontend)
    if (url.pathname ===/ || !url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    // API Routes
    if (url.pathname === "/api/chat") {
      // Handle POST requests for chat
      if (request.method === "POST") {
        return handleChatRequest(request, env);
      }

      // Method not allowed for other request types
      return new Response("Method not allowed", { status:  });
    }

    // Handle  for unmatched routes
    return new Response("Not found", { status:  });
  },
} satisfies ExportedHandler<Env>;

/**
 * Handles chat API requests
 */
async function handleChatRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    // Parse JSON request body
    const { messages = } = (await request.json()) as {
      messages: ChatMessage[];
    };

    // Add system prompt if not present
    if (!messages.some((msg) => msg.role === "system")) {
      messages.unshift({ role: "system", content: SYSTEM_PROMPT });
    }

    // Check if env.AI and env.AI.run are defined
    if (env && env.AI && typeof env.AI.run === 'function') {
      const response = await env.AI.run(
        MODEL_ID,
        {
          messages,
          max_tokens: 2048,
        },
        {
          returnRawResponse:,
          // Uncomment to use AI Gateway
          // gateway: {
          //   id: "YOUR_GATEWAY_ID", // Replace with your AI Gateway ID
          //   skipCache:,      // Set to to bypass cache
          //   cacheTtl: ,        // Cache time-to-live in seconds
          // },
        },
      );

      // Return streaming response
      return response;
    } else {
      return new Response('Error: env.AI is not defined or does not have a run method', { status:  });
    }
  } catch (error) {
    console.error("Error processing chat request:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: ,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
