"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureStorageJobQueue = void 0;
class AzureStorageJobQueue {
    queue;
    constructor(queue) {
        this.queue = queue;
    }
    async initialize() {
        console.log("[queue] ensuring queue exists", { queue: this.queue.name });
        await this.queue.createIfNotExists();
        console.log("[queue] queue ready", { queue: this.queue.name });
    }
    async send(job) {
        console.log("[queue] sending job", {
            queue: this.queue.name,
            interactionId: job.request.interaction_id,
            jobId: job.jobId
        });
        await this.queue.sendMessage(JSON.stringify(job));
        console.log("[queue] job sent", { queue: this.queue.name, jobId: job.jobId });
    }
}
exports.AzureStorageJobQueue = AzureStorageJobQueue;
//# sourceMappingURL=job-queue.js.map