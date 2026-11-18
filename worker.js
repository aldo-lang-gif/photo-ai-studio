export default {
  // PIXORA AI CORE - Git integration test
  async fetch(request, env) {
    const url = new URL(request.url);

    // Simple public status endpoint. No AI inference is executed.
    if (url.pathname !== "/health") {
      return new Response("PIXORA AI CORE is online. Try /health.", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    // Check that both configured bindings are available.
    if (!env.AI || !env.RL) {
      return Response.json(
        {
          ok: false,
          worker: "PIXORA AI CORE",
          error: "Missing AI or RL binding"
        },
        { status: 500 }
      );
    }

    // Apply the configured rate limiter to the health endpoint.
    const clientKey =
      request.headers.get("CF-Connecting-IP") || "unknown";
    const { success } = await env.RL.limit({ key: clientKey });

    if (!success) {
      return Response.json(
        {
          ok: false,
          error: "Test limit reached. Please wait before trying again."
        },
        { status: 429 }
      );
    }

    return Response.json({
      ok: true,
      worker: "PIXORA AI CORE",
      workersAI: "binding detected",
      rateLimiter: "binding detected",
      model: "not invoked",
      inferenceExecuted: false
    });
  }
};
