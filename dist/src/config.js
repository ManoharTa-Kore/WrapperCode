"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const zod_1 = require("zod");
const optionalNonEmpty = zod_1.z.preprocess((value) => value === "" ? undefined : value, zod_1.z.string().min(1).optional());
const configSchema = zod_1.z.object({
    AZURE_STORAGE_CONNECTION_STRING: optionalNonEmpty,
    STORAGE_ACCOUNT_NAME: optionalNonEmpty,
    EMAIL_QUEUE_NAME: zod_1.z.string().min(3).default("email-jobs"),
    ATTACHMENT_CONTAINER_NAME: zod_1.z.string().min(3).default("email-attachments"),
    ATTACHMENT_MODE: zod_1.z.enum(["api", "mock"]).default("api"),
    ATTACHMENT_API_URL: zod_1.z.string().url(),
    ATTACHMENT_API_KEY: optionalNonEmpty,
    AGENT_PLATFORM_URL: zod_1.z.string().url(),
    AGENT_TENANT_ID: zod_1.z.string().min(1),
    AGENT_PLATFORM_API_KEY: zod_1.z.string().min(1),
    AGENT_PROJECT_ID: zod_1.z.string().min(1),
    AGENT_SUBSCRIPTION_ID: zod_1.z.string().min(1),
    DEFAULT_LOCALE: zod_1.z.string().min(1).default("en-US"),
    DEFAULT_TIMEZONE: zod_1.z.string().min(1).default("Asia/Kolkata"),
    ATTACHMENT_URL_TTL_SECONDS: zod_1.z.coerce.number().int().positive().max(604200).default(3600),
    MAX_ATTACHMENT_BYTES: zod_1.z.coerce.number().int().positive().default(25 * 1024 * 1024),
    MAX_TOTAL_ATTACHMENT_BYTES: zod_1.z.coerce.number().int().positive().default(50 * 1024 * 1024),
    HTTP_TIMEOUT_MS: zod_1.z.coerce.number().int().positive().default(30000)
}).superRefine((config, context) => {
    if (!config.AZURE_STORAGE_CONNECTION_STRING && !config.STORAGE_ACCOUNT_NAME) {
        context.addIssue({
            code: "custom",
            path: ["STORAGE_ACCOUNT_NAME"],
            message: "Set AZURE_STORAGE_CONNECTION_STRING locally or STORAGE_ACCOUNT_NAME in Azure"
        });
    }
});
function loadConfig(environment = process.env) {
    return configSchema.parse(environment);
}
//# sourceMappingURL=config.js.map