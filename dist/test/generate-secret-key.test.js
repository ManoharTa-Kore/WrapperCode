"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_crypto_1 = require("node:crypto");
const node_test_1 = __importDefault(require("node:test"));
const generate_secret_key_1 = require("../src/functions/generate-secret-key");
const appId = "585C39D7-5DA4-E2CA-E063-3015900A722C";
const requestHashKey = "12345678901234567890123456789012";
const environmentHashKey = "abcdefghijklmnopqrstuvwxyzABCDEF";
const timestamp = 1787930000;
function decrypt(secretKey, hashKey) {
    const decipher = (0, node_crypto_1.createDecipheriv)("aes-256-ecb", Buffer.from(hashKey, "utf8"), null);
    decipher.setAutoPadding(true);
    return Buffer.concat([
        decipher.update(Buffer.from(secretKey, "base64")),
        decipher.final()
    ]).toString("utf8");
}
(0, node_test_1.default)("uses a request hash key when provided", () => {
    const result = (0, generate_secret_key_1.generateSecretKey)({ appId, hashKey: requestHashKey }, environmentHashKey, timestamp);
    strict_1.default.equal(result.timestamp, timestamp);
    strict_1.default.equal(decrypt(result.secretKey, requestHashKey), `${appId}_${timestamp}`);
});
(0, node_test_1.default)("falls back to SECRET_KEY_HASH_KEY when hashKey is omitted", () => {
    const result = (0, generate_secret_key_1.generateSecretKey)({ appId }, environmentHashKey, timestamp);
    strict_1.default.equal(decrypt(result.secretKey, environmentHashKey), `${appId}_${timestamp}`);
});
(0, node_test_1.default)("rejects a missing hash key and keys that are not exactly 32 UTF-8 bytes", () => {
    strict_1.default.throws(() => (0, generate_secret_key_1.generateSecretKey)({ appId }, undefined, timestamp), generate_secret_key_1.SecretKeyInputError);
    strict_1.default.throws(() => (0, generate_secret_key_1.generateSecretKey)({ appId, hashKey: "too-short" }, undefined, timestamp), /exactly 32 UTF-8 bytes/);
    strict_1.default.throws(() => (0, generate_secret_key_1.generateSecretKey)({ appId, hashKey: "😀".repeat(32) }, undefined, timestamp), /exactly 32 UTF-8 bytes/);
});
//# sourceMappingURL=generate-secret-key.test.js.map