"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.emailJob = exports.genesysRequest = void 0;
exports.genesysRequest = {
    t2r_type: "mailbot",
    portalcode: "100000XX",
    interaction_id: "0003QaM9U54S1XX",
    article_code: "00000000000000010XX",
    input_content: "Please escalate the Internet complaint.",
    attachment: "true",
    response_json: {}
};
exports.emailJob = {
    version: 1,
    jobId: "fa631a28-1e13-463a-818c-21518650800c",
    receivedAt: "2026-08-21T08:00:00.000Z",
    request: exports.genesysRequest
};
exports.config = {
    AZURE_STORAGE_CONNECTION_STRING: "UseDevelopmentStorage=true",
    EMAIL_QUEUE_NAME: "email-jobs",
    ATTACHMENT_CONTAINER_NAME: "email-attachments",
    ATTACHMENT_MODE: "api",
    ATTACHMENT_API_URL: "https://genesys.example/api/interaction/attachments",
    AGENT_PLATFORM_URL: "https://agents-dev.kore.ai/api/v1/channels/http-async/message",
    AGENT_TENANT_ID: "tenant-1",
    AGENT_PLATFORM_API_KEY: "secret",
    AGENT_PROJECT_ID: "project-1",
    AGENT_SUBSCRIPTION_ID: "subscription-1",
    DEFAULT_LOCALE: "en-US",
    DEFAULT_TIMEZONE: "Asia/Kolkata",
    ATTACHMENT_URL_TTL_SECONDS: 3600,
    MAX_ATTACHMENT_BYTES: 25 * 1024 * 1024,
    MAX_TOTAL_ATTACHMENT_BYTES: 50 * 1024 * 1024,
    HTTP_TIMEOUT_MS: 30000
};
//# sourceMappingURL=fixtures.js.map