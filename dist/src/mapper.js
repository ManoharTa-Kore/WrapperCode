"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAgentRequest = toAgentRequest;
const node_crypto_1 = require("node:crypto");
function toAgentRequest(job, attachments, config) {
    const input = job.request;
    return {
        project_id: config.AGENT_PROJECT_ID,
        subscription_id: config.AGENT_SUBSCRIPTION_ID,
        session_key: input.interaction_id,
        idempotency_key: (0, node_crypto_1.randomUUID)(),
        message: input.input_content,
        attachment_urls: attachments.map((attachment) => attachment.url),
        metadata: {
            sessionMetadata: {
                portalcode: input.portalcode,
                articleCode: input.article_code,
                interactionId: input.interaction_id,
                sourceType: input.t2r_type
            }
        },
        interactionContext: {
            locale: config.DEFAULT_LOCALE,
            timezone: config.DEFAULT_TIMEZONE
        }
    };
}
//# sourceMappingURL=mapper.js.map