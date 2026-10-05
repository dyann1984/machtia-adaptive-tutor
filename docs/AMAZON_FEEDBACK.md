# Amazon developer feedback — participant draft

This draft describes the tested custom MCP and simulated experience. It does not claim use of unavailable Alexa+ preview SDKs, an Echo device or Bedrock inference. The participant must review and submit it through the official feedback channel.

We built a custom Streamable HTTP MCP server and an independent conversational Alexa+ experience simulator for an educational workflow. Tool discovery, authenticated calls and a complete recorded-answer journey were verified using the official Model Context Protocol SDK client. We found that a shared server-side learning ledger is necessary to keep web and conversational reports consistent; client-supplied correctness flags cannot be authoritative.

Concrete interoperability work included sending both required Accept types, returning 202 for initialized notifications, rejecting invalid JSON-RPC batches and payloads, checking Origin, and separating public tool discovery from protected synthetic student data. The demo controller intentionally switches personas; student capabilities cannot claim a teacher identity. We did not validate this service inside Amazon's native preview tooling and cannot report its latency, UX or costs.

Suggestions for Amazon documentation: provide an end-to-end authenticated MCP example with separate tool-discovery and protected-call behavior, include negative protocol/security tests, and document how a simulated contest experience should label unsupported native capabilities. A sample that compares one persistent evidence object across web and conversational clients would help developers avoid divergent reporting.

Separate local tooling observation: Windows Application Control blocked native build/test bindings in our environment. Official WASM alternatives allowed the test suite and build to run without disabling system protection. This is not attributed to an Amazon product.
