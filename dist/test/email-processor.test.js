"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const email_processor_1 = require("../src/services/email-processor");
const fixtures_1 = require("./fixtures");
(0, node_test_1.default)("fetches, stores, and submits attachment URLs", async () => {
    let submitted;
    const dependencies = {
        attachments: {
            async fetch() {
                return [{
                        fileName: "hello.txt",
                        mimeType: "text/plain",
                        sizeBytes: 5,
                        contentBase64: "aGVsbG8="
                    }];
            }
        },
        attachmentStore: {
            async upload(context, attachment) {
                strict_1.default.deepEqual(context, {
                    interactionId: fixtures_1.emailJob.request.interaction_id,
                    sourceTag: "genesys",
                    operationId: fixtures_1.emailJob.jobId,
                    index: 0
                });
                return {
                    fileName: attachment.fileName,
                    mimeType: attachment.mimeType,
                    url: "https://storage.example/hello.txt?sig=redacted",
                    expiresAt: "2026-08-21T09:00:00.000Z"
                };
            }
        },
        agent: {
            async submit(payload) {
                submitted = payload;
                return { httpStatus: 202, response: { requestId: "agent-run-1" } };
            }
        }
    };
    const result = await (0, email_processor_1.processEmail)(fixtures_1.emailJob, fixtures_1.config, dependencies);
    strict_1.default.equal(result.httpStatus, 202);
    strict_1.default.deepEqual(submitted?.attachment_urls, ["https://storage.example/hello.txt?sig=redacted"]);
});
(0, node_test_1.default)("skips the attachment API when attachment is the string false", async () => {
    const withoutAttachments = {
        ...fixtures_1.emailJob,
        request: { ...fixtures_1.emailJob.request, attachment: "false" }
    };
    const dependencies = {
        attachments: { async fetch() { throw new Error("must not be called"); } },
        attachmentStore: { async upload() { throw new Error("must not be called"); } },
        agent: {
            async submit(payload) {
                strict_1.default.deepEqual(payload.attachment_urls, []);
                return { httpStatus: 202, response: {} };
            }
        }
    };
    await (0, email_processor_1.processEmail)(withoutAttachments, fixtures_1.config, dependencies);
});
//# sourceMappingURL=email-processor.test.js.map