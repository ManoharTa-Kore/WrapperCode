"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretKeyInputError = void 0;
exports.generateSecretKey = generateSecretKey;
exports.generateSecretKeyHandler = generateSecretKeyHandler;
const node_crypto_1 = require("node:crypto");
const functions_1 = require("@azure/functions");
const zod_1 = require("zod");
const contracts_1 = require("../contracts");
class SecretKeyInputError extends Error {
    constructor(message) {
        super(message);
        this.name = "SecretKeyInputError";
    }
}
exports.SecretKeyInputError = SecretKeyInputError;
function generateSecretKey(request, environmentHashKey, timestamp = Math.floor(Date.now() / 1000)) {
    const hashKey = request.hashKey ?? environmentHashKey;
    if (!hashKey) {
        throw new SecretKeyInputError("hashKey is required when SECRET_KEY_HASH_KEY is not configured");
    }
    const key = Buffer.from(hashKey, "utf8");
    if (key.byteLength !== 32) {
        throw new SecretKeyInputError("Hash key must be exactly 32 UTF-8 bytes for AES-256");
    }
    const plaintext = `${request.appId}_${timestamp}`;
    const cipher = (0, node_crypto_1.createCipheriv)("aes-256-ecb", key, null);
    cipher.setAutoPadding(true);
    const encrypted = Buffer.concat([
        cipher.update(Buffer.from(plaintext, "utf8")),
        cipher.final()
    ]);
    return {
        secretKey: encrypted.toString("base64"),
        timestamp
    };
}
async function generateSecretKeyHandler(httpRequest, context) {
    try {
        console.log("[secret-key] request received", {
            method: httpRequest.method,
            path: new URL(httpRequest.url).pathname
        });
        const request = contracts_1.secretKeyRequestSchema.parse(await httpRequest.json());
        const response = generateSecretKey(request, process.env.SECRET_KEY_HASH_KEY);
        console.log("[secret-key] generated", {
            hashKeySource: request.hashKey === undefined ? "environment" : "request",
            timestamp: response.timestamp
        });
        return { status: 200, jsonBody: response };
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            console.error("[secret-key] request validation failed", { issues: error.issues });
            return {
                status: 400,
                jsonBody: {
                    error: "Invalid secret-key request",
                    issues: error.issues.map((issue) => ({
                        path: issue.path.join("."),
                        message: issue.message
                    }))
                }
            };
        }
        if (error instanceof SyntaxError) {
            console.error("[secret-key] invalid JSON body");
            return { status: 400, jsonBody: { error: "Request body must be valid JSON" } };
        }
        if (error instanceof SecretKeyInputError) {
            console.error("[secret-key] input rejected", { error: error.message });
            return { status: 400, jsonBody: { error: error.message } };
        }
        context.error(`Unable to generate secret key: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`);
        console.error("[secret-key] generation failed", {
            error: error instanceof Error ? error.message : "Unknown error"
        });
        return { status: 500, jsonBody: { error: "Unable to generate secret key" } };
    }
}
functions_1.app.http("generateSecretKey", {
    route: "security/secret-key",
    methods: ["POST"],
    authLevel: "function",
    handler: generateSecretKeyHandler
});
//# sourceMappingURL=generate-secret-key.js.map