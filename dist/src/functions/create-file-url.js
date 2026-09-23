"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFileUrl = createFileUrl;
exports.createFileUrlHandler = createFileUrlHandler;
const node_crypto_1 = require("node:crypto");
const functions_1 = require("@azure/functions");
const zod_1 = require("zod");
const contracts_1 = require("../contracts");
const blob_storage_1 = require("../services/blob-storage");
const runtime_1 = require("../services/runtime");
async function createFileUrl(request, dependencies, uploadId = (0, node_crypto_1.randomUUID)()) {
    const bytes = (0, blob_storage_1.decodeBase64Content)(request.contentBase64, dependencies.maxAttachmentBytes);
    const attachment = {
        fileName: request.fileName,
        mimeType: request.mimeType,
        sizeBytes: bytes.byteLength,
        contentBase64: request.contentBase64
    };
    const stored = await dependencies.attachmentStore.upload({
        interactionId: request.interactionId,
        sourceTag: request.tag,
        operationId: uploadId
    }, attachment, request.ttlSeconds);
    return {
        uploadId,
        interactionId: request.interactionId,
        tag: request.tag,
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        sizeBytes: bytes.byteLength,
        url: stored.url,
        expiresAt: stored.expiresAt
    };
}
async function createFileUrlHandler(httpRequest, context) {
    try {
        console.log("[base64-url] request received", {
            method: httpRequest.method,
            path: new URL(httpRequest.url).pathname
        });
        const request = contracts_1.base64FileRequestSchema.parse(await httpRequest.json());
        const runtime = (0, runtime_1.getFileUploadRuntime)();
        const response = await createFileUrl(request, {
            attachmentStore: runtime.attachmentStore,
            maxAttachmentBytes: runtime.config.MAX_ATTACHMENT_BYTES
        });
        console.log("[base64-url] file URL created", {
            uploadId: response.uploadId,
            interactionId: response.interactionId,
            tag: response.tag,
            fileName: response.fileName,
            mimeType: response.mimeType,
            sizeBytes: response.sizeBytes,
            expiresAt: response.expiresAt
        });
        return { status: 201, jsonBody: response };
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            console.error("[base64-url] request validation failed", { issues: error.issues });
            return {
                status: 400,
                jsonBody: {
                    error: "Invalid base64 file request",
                    issues: error.issues.map((issue) => ({
                        path: issue.path.join("."),
                        message: issue.message
                    }))
                }
            };
        }
        if (error instanceof SyntaxError) {
            return { status: 400, jsonBody: { error: "Request body must be valid JSON" } };
        }
        const message = error instanceof Error ? error.message : "Unknown error";
        if (/invalid base64|exceeds|TTL must be/.test(message)) {
            console.error("[base64-url] file rejected", { error: message });
            return { status: 400, jsonBody: { error: message } };
        }
        context.error(`Unable to create file URL: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`);
        console.error("[base64-url] request failed", { error: message });
        return { status: 500, jsonBody: { error: "Unable to create file URL" } };
    }
}
functions_1.app.http("createFileUrl", {
    route: "files/base64-to-url",
    methods: ["POST"],
    authLevel: "function",
    handler: createFileUrlHandler
});
//# sourceMappingURL=create-file-url.js.map