"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentClient = void 0;
const http_client_1 = require("./http-client");
class AgentClient {
    config;
    constructor(config) {
        this.config = config;
    }
    async submit(payload, context) {
        console.log("[agent] submitting message", {
            sessionKey: payload.session_key,
            idempotencyKey: payload.idempotency_key,
            attachmentUrlCount: payload.attachment_urls.length
        });
        const result = await (0, http_client_1.requestJson)("Kore agent platform", this.config.AGENT_PLATFORM_URL, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "X-Tenant-Id": this.config.AGENT_TENANT_ID,
                "Authorization": `Bearer ${this.config.AGENT_PLATFORM_API_KEY}`,
                "idempotency-key": payload.idempotency_key
            },
            body: JSON.stringify(payload)
        }, this.config.HTTP_TIMEOUT_MS, context);
        console.log("[agent] message accepted by HTTP endpoint", { httpStatus: result.status });
        return { httpStatus: result.status, response: result.body };
    }
}
exports.AgentClient = AgentClient;
//# sourceMappingURL=agent-client.js.map