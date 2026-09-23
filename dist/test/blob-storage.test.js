"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const blob_storage_1 = require("../src/services/blob-storage");
const attachment = {
    fileName: "hello.txt",
    mimeType: "text/plain",
    sizeBytes: 5,
    contentBase64: "aGVsbG8="
};
(0, node_test_1.default)("decodes attachment base64 and verifies the declared size", () => {
    strict_1.default.equal((0, blob_storage_1.decodeAttachment)(attachment, 100).toString("utf8"), "hello");
});
(0, node_test_1.default)("rejects invalid, mismatched, and oversized attachments", () => {
    strict_1.default.throws(() => (0, blob_storage_1.decodeAttachment)({ ...attachment, contentBase64: "invalid!" }, 100), /invalid base64/);
    strict_1.default.throws(() => (0, blob_storage_1.decodeAttachment)({ ...attachment, sizeBytes: 6 }, 100), /does not match/);
    strict_1.default.throws(() => (0, blob_storage_1.decodeAttachment)(attachment, 4), /exceeds/);
});
(0, node_test_1.default)("groups email and direct uploads under the interaction prefix", () => {
    strict_1.default.equal((0, blob_storage_1.attachmentBlobName)({
        interactionId: "0003QaM9U54S1XX",
        sourceTag: "genesys",
        operationId: "fa631a28-1e13-463a-818c-21518650800c",
        index: 1
    }, "signature.png"), "interactions/0003QaM9U54S1XX/genesys-fa631a28-1e13-463a-818c-21518650800c-1-signature.png");
    strict_1.default.equal((0, blob_storage_1.attachmentBlobName)({
        interactionId: "0003QaM9U54S1XX",
        sourceTag: "supporting-document",
        operationId: "11111111-1111-4111-8111-111111111111"
    }, "statement.pdf"), "interactions/0003QaM9U54S1XX/supporting-document-11111111-1111-4111-8111-111111111111-statement.pdf");
});
//# sourceMappingURL=blob-storage.test.js.map