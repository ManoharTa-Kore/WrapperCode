"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processEmailHandler = processEmailHandler;
const functions_1 = require("@azure/functions");
const contracts_1 = require("../contracts");
const email_processor_1 = require("../services/email-processor");
const runtime_1 = require("../services/runtime");
function safeError(error) {
    return error instanceof Error ? `${error.name}: ${error.message}`.slice(0, 1000) : "Unknown error";
}
async function processEmailHandler(message, context) {
    console.log("[process] queue message received", {
        dequeueCount: context.triggerMetadata?.dequeueCount
    });
    const job = (0, contracts_1.parseEmailJob)(message);
    console.log("[process] queue message parsed", {
        interactionId: job.request.interaction_id,
        jobId: job.jobId,
        hasAttachments: job.request.attachment === "true"
    });
    const runtime = (0, runtime_1.getProcessorRuntime)();
    const interactionId = job.request.interaction_id;
    context.log(`Processing Genesys email ${JSON.stringify({
        interactionId,
        jobId: job.jobId,
        hasAttachments: job.request.attachment === "true"
    })}`);
    try {
        const submission = await (0, email_processor_1.processEmail)(job, runtime.config, runtime.processor, context);
        context.log(`Submitted Genesys email to agent platform ${JSON.stringify({
            interactionId,
            jobId: job.jobId,
            agentHttpStatus: submission.httpStatus
        })}`);
    }
    catch (error) {
        const dequeueCount = Number(context.triggerMetadata?.dequeueCount ?? 1);
        context.error(`Genesys email processing failed ${JSON.stringify({
            interactionId,
            jobId: job.jobId,
            dequeueCount,
            error: safeError(error)
        })}`);
        console.error("[process] processing failed", { interactionId, jobId: job.jobId, error: safeError(error) });
        throw error;
    }
}
functions_1.app.storageQueue("processGenesysEmail", {
    queueName: process.env.EMAIL_QUEUE_NAME ?? "email-jobs",
    connection: "EMAIL_DATA_STORAGE",
    handler: processEmailHandler
});
//# sourceMappingURL=process-email.js.map