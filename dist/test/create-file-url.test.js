"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const create_file_url_1 = require("../src/functions/create-file-url");
(0, node_test_1.default)("uploads base64 content under the interaction prefix", async () => {
    let capturedContext;
    let capturedSize;
    let capturedTtl;
    const result = await (0, create_file_url_1.createFileUrl)({
        interactionId: "0003QaM9U54S1XX",
        tag: "supporting-document",
        fileName: "hello.txt",
        mimeType: "text/plain",
        contentBase64: "aGVsbG8=",
        ttlSeconds: 600
    }, {
        maxAttachmentBytes: 100,
        attachmentStore: {
            async upload(context, attachment, ttlSeconds) {
                capturedContext = context;
                capturedSize = attachment.sizeBytes;
                capturedTtl = ttlSeconds;
                return {
                    fileName: attachment.fileName,
                    mimeType: attachment.mimeType,
                    url: "https://storage.example/hello.txt?sig=redacted",
                    expiresAt: "2026-08-28T12:00:00.000Z"
                };
            }
        }
    }, "11111111-1111-4111-8111-111111111111");
    strict_1.default.deepEqual(capturedContext, {
        interactionId: "0003QaM9U54S1XX",
        sourceTag: "supporting-document",
        operationId: "11111111-1111-4111-8111-111111111111"
    });
    strict_1.default.equal(capturedSize, 5);
    strict_1.default.equal(capturedTtl, 600);
    strict_1.default.equal(result.sizeBytes, 5);
    strict_1.default.equal(result.uploadId, "11111111-1111-4111-8111-111111111111");
    strict_1.default.equal(result.interactionId, "0003QaM9U54S1XX");
    strict_1.default.equal(result.tag, "supporting-document");
});
(0, node_test_1.default)("rejects invalid and oversized base64 content", async () => {
    const dependencies = {
        maxAttachmentBytes: 4,
        attachmentStore: {
            async upload() {
                throw new Error("must not upload");
            }
        }
    };
    await strict_1.default.rejects((0, create_file_url_1.createFileUrl)({
        interactionId: "0003QaM9U54S1XX",
        tag: "supporting-document",
        fileName: "bad.txt",
        mimeType: "text/plain",
        contentBase64: "invalid!"
    }, dependencies), /invalid base64/);
    await strict_1.default.rejects((0, create_file_url_1.createFileUrl)({
        interactionId: "0003QaM9U54S1XX",
        tag: "supporting-document",
        fileName: "large.txt",
        mimeType: "text/plain",
        contentBase64: "aGVsbG8="
    }, dependencies), /exceeds/);
});
//# sourceMappingURL=create-file-url.test.js.map