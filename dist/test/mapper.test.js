"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const mapper_1 = require("../src/mapper");
const fixtures_1 = require("./fixtures");
(0, node_test_1.default)("maps Genesys fields and deployment-time subscription ID to the agent request", () => {
    const result = (0, mapper_1.toAgentRequest)(fixtures_1.emailJob, [{
            fileName: "invoice.pdf",
            mimeType: "application/pdf",
            url: "https://storage.example/invoice.pdf?sig=redacted",
            expiresAt: "2026-08-21T09:00:00.000Z"
        }], fixtures_1.config);
    strict_1.default.equal(result.project_id, "project-1");
    strict_1.default.equal(result.subscription_id, "subscription-1");
    strict_1.default.equal(result.session_key, genesysRequestId());
    strict_1.default.equal(result.idempotency_key, `genesys-${genesysRequestId()}`);
    strict_1.default.deepEqual(result.attachment_urls, ["https://storage.example/invoice.pdf?sig=redacted"]);
    strict_1.default.equal(result.metadata.sessionMetadata.portalcode, "100000XX");
    strict_1.default.equal(result.metadata.sessionMetadata.interactionId, genesysRequestId());
});
function genesysRequestId() {
    return fixtures_1.emailJob.request.interaction_id;
}
//# sourceMappingURL=mapper.test.js.map