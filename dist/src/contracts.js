"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachmentResponseSchema = exports.emailJobSchema = exports.secretKeyRequestSchema = exports.base64FileRequestSchema = exports.genesysRequestSchema = void 0;
exports.parseEmailJob = parseEmailJob;
const zod_1 = require("zod");
const attachmentFlagSchema = zod_1.z.union([zod_1.z.literal("true"), zod_1.z.literal("false")]);
exports.genesysRequestSchema = zod_1.z.object({
    t2r_type: zod_1.z.string().min(1),
    portalcode: zod_1.z.string().min(1),
    interaction_id: zod_1.z.string().min(1),
    article_code: zod_1.z.string().min(1),
    input_content: zod_1.z.string().min(1),
    attachment: attachmentFlagSchema,
    response_json: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).default({})
}).strict();
exports.base64FileRequestSchema = zod_1.z.object({
    interactionId: zod_1.z.string().min(1).max(200),
    tag: zod_1.z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, "tag may contain only letters, numbers, hyphens, and underscores"),
    fileName: zod_1.z.string().min(1).max(255),
    mimeType: zod_1.z.string().min(1).max(255),
    contentBase64: zod_1.z.string().min(1),
    ttlSeconds: zod_1.z.number().int().positive().max(604200).optional()
}).strict();
exports.secretKeyRequestSchema = zod_1.z.object({
    appId: zod_1.z.string().min(1).max(200),
    hashKey: zod_1.z.string().min(1).optional()
}).strict();
exports.emailJobSchema = zod_1.z.object({
    version: zod_1.z.literal(1),
    jobId: zod_1.z.string().uuid(),
    receivedAt: zod_1.z.string().datetime(),
    request: exports.genesysRequestSchema
});
exports.attachmentResponseSchema = zod_1.z.object({
    ixnId: zod_1.z.string().min(1),
    subject: zod_1.z.string(),
    attachmentCount: zod_1.z.number().int().nonnegative(),
    attachments: zod_1.z.array(zod_1.z.object({
        fileName: zod_1.z.string().min(1),
        mimeType: zod_1.z.string().min(1),
        sizeBytes: zod_1.z.number().int().nonnegative(),
        contentBase64: zod_1.z.string().min(1)
    })).max(20)
}).superRefine((response, context) => {
    if (response.attachmentCount !== response.attachments.length) {
        context.addIssue({
            code: "custom",
            path: ["attachmentCount"],
            message: "attachmentCount does not match attachments length"
        });
    }
});
function parseEmailJob(message) {
    return exports.emailJobSchema.parse(typeof message === "string" ? JSON.parse(message) : message);
}
//# sourceMappingURL=contracts.js.map