"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processEmail = processEmail;
const mapper_1 = require("../mapper");
async function processEmail(job, config, dependencies, context) {
    const stored = [];
    console.log("[processor] started", {
        interactionId: job.request.interaction_id,
        jobId: job.jobId,
        hasAttachments: job.request.attachment === "true"
    });
    if (job.request.attachment === "true") {
        console.log("[processor] retrieving attachments", { interactionId: job.request.interaction_id });
        const attachments = await dependencies.attachments.fetch(job.request, context);
        const totalBytes = attachments.reduce((total, attachment) => total + attachment.sizeBytes, 0);
        if (totalBytes > config.MAX_TOTAL_ATTACHMENT_BYTES) {
            throw new Error(`Total attachment size exceeds the ${config.MAX_TOTAL_ATTACHMENT_BYTES} byte limit`);
        }
        console.log("[processor] attachments retrieved", {
            interactionId: job.request.interaction_id,
            count: attachments.length,
            totalBytes
        });
        for (const [index, attachment] of attachments.entries()) {
            console.log("[processor] storing attachment", {
                interactionId: job.request.interaction_id,
                index,
                fileName: attachment.fileName,
                mimeType: attachment.mimeType,
                sizeBytes: attachment.sizeBytes
            });
            stored.push(await dependencies.attachmentStore.upload({
                interactionId: job.request.interaction_id,
                sourceTag: "genesys",
                operationId: job.jobId,
                index
            }, attachment));
        }
        console.log("[processor] attachments stored", {
            interactionId: job.request.interaction_id,
            count: stored.length
        });
    }
    const agentRequest = (0, mapper_1.toAgentRequest)(job, stored, config);
    console.log("[processor] submitting Agent request", {
        interactionId: job.request.interaction_id,
        jobId: job.jobId,
        attachmentUrlCount: agentRequest.attachment_urls.length,
        idempotencyKey: agentRequest.idempotency_key
    });
    const result = await dependencies.agent.submit(agentRequest, context);
    console.log("[processor] Agent request completed", {
        interactionId: job.request.interaction_id,
        jobId: job.jobId,
        httpStatus: result.httpStatus
    });
    return result;
}
//# sourceMappingURL=email-processor.js.map