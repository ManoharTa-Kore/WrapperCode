"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitEmail = submitEmail;
exports.submitEmailHandler = submitEmailHandler;
const node_crypto_1 = require("node:crypto");
const functions_1 = require("@azure/functions");
const zod_1 = require("zod");
const contracts_1 = require("../contracts");
const runtime_1 = require("../services/runtime");
async function submitEmail(request, dependencies, jobId = (0, node_crypto_1.randomUUID)(), receivedAt = new Date().toISOString()) {
    const job = { version: 1, jobId, receivedAt, request };
    console.log("[submit] publishing email job", {
        interactionId: request.interaction_id,
        jobId,
        hasAttachments: request.attachment === "true"
    });
    await dependencies.queue.send(job);
    console.log("[submit] email job published", { interactionId: request.interaction_id, jobId });
    return { interaction_id: request.interaction_id, status: "PENDING", deduped: false };
}
async function submitEmailHandler(httpRequest, context) {
    try {
        console.log("[submit] request received", {
            method: httpRequest.method,
            path: new URL(httpRequest.url).pathname
        });
        const request = contracts_1.genesysRequestSchema.parse(await httpRequest.json());
        console.log("[submit] request validated", {
            interactionId: request.interaction_id,
            hasAttachments: request.attachment === "true"
        });
        const runtime = await (0, runtime_1.getSubmitRuntime)();
        const response = await submitEmail(request, runtime);
        context.log(`Accepted Genesys email ${JSON.stringify({
            interactionId: request.interaction_id,
            hasAttachments: request.attachment === "true"
        })}`);
        return { status: 202, jsonBody: response };
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            console.error("[submit] request validation failed", { issues: error.issues });
            return {
                status: 400,
                jsonBody: {
                    error: "Invalid Genesys request",
                    issues: error.issues.map((issue) => ({
                        path: issue.path.join("."),
                        message: issue.message
                    }))
                }
            };
        }
        if (error instanceof SyntaxError) {
            console.error("[submit] invalid JSON body");
            return { status: 400, jsonBody: { error: "Request body must be valid JSON" } };
        }
        context.error(`Unable to accept Genesys email: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`);
        console.error("[submit] request failed", error);
        return { status: 500, jsonBody: { error: "Unable to accept email" } };
    }
}
functions_1.app.http("submitGenesysEmail", {
    route: "t2r/email/invoke",
    methods: ["POST"],
    authLevel: "function",
    handler: submitEmailHandler
});
//# sourceMappingURL=submit-email.js.map