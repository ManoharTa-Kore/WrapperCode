"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentClient = exports.MockAttachmentClient = void 0;
const contracts_1 = require("../contracts");
const http_client_1 = require("./http-client");
class MockAttachmentClient {
    async fetch(input, _context) {
        console.log("[attachments] mock source selected", { interactionId: input.interaction_id });
        const contentBase64 = Buffer.from(`Mock attachment for ${input.interaction_id}\n`, "utf8").toString("base64");
        const attachment = {
            fileName: "mock-attachment.txt",
            mimeType: "text/plain",
            sizeBytes: Buffer.byteLength(Buffer.from(contentBase64, "base64")),
            contentBase64
        };
        console.log("[attachments] mock attachment generated", {
            interactionId: input.interaction_id,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes
        });
        return [attachment];
    }
}
exports.MockAttachmentClient = MockAttachmentClient;
class AttachmentClient {
    config;
    constructor(config) {
        this.config = config;
    }
    async fetch(input, context) {
        console.log("[attachments] calling Genesys attachment API", { interactionId: input.interaction_id });
        const response = await (0, http_client_1.requestJson)("Genesys attachment API", this.config.ATTACHMENT_API_URL, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                ...(0, http_client_1.bearerHeader)(this.config.ATTACHMENT_API_KEY)
            },
            body: JSON.stringify({ ixnId: input.interaction_id })
        }, this.config.HTTP_TIMEOUT_MS, context);
        const parsed = contracts_1.attachmentResponseSchema.parse(response.body);
        if (parsed.ixnId !== input.interaction_id) {
            throw new Error("Attachment API returned a different ixnId");
        }
        console.log("[attachments] attachment API response validated", {
            interactionId: input.interaction_id,
            attachmentCount: parsed.attachments.length,
            totalBytes: parsed.attachments.reduce((total, item) => total + item.sizeBytes, 0)
        });
        return parsed.attachments;
    }
}
exports.AttachmentClient = AttachmentClient;
//# sourceMappingURL=attachment-client.js.map