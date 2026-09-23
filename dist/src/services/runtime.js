"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubmitRuntime = getSubmitRuntime;
exports.getProcessorRuntime = getProcessorRuntime;
exports.getFileUploadRuntime = getFileUploadRuntime;
const config_1 = require("../config");
const agent_client_1 = require("./agent-client");
const attachment_client_1 = require("./attachment-client");
const blob_storage_1 = require("./blob-storage");
const job_queue_1 = require("./job-queue");
const storage_clients_1 = require("./storage-clients");
let config;
let submitRuntimePromise;
let processorRuntime;
let fileUploadRuntime;
function getConfig() {
    config ??= (0, config_1.loadConfig)();
    return config;
}
function getSubmitRuntime() {
    submitRuntimePromise ??= createSubmitRuntime();
    return submitRuntimePromise;
}
async function createSubmitRuntime() {
    const currentConfig = getConfig();
    console.log("[runtime:submit] initializing", {
        storageAccount: currentConfig.STORAGE_ACCOUNT_NAME ?? "connection-string",
        queue: currentConfig.EMAIL_QUEUE_NAME
    });
    const queue = new job_queue_1.AzureStorageJobQueue((0, storage_clients_1.createQueueClient)(currentConfig));
    await queue.initialize();
    console.log("[runtime:submit] initialized");
    return { queue };
}
function getProcessorRuntime() {
    processorRuntime ??= createProcessorRuntime();
    return processorRuntime;
}
function createProcessorRuntime() {
    const currentConfig = getConfig();
    console.log("[runtime:processor] initializing", {
        storageAccount: currentConfig.STORAGE_ACCOUNT_NAME ?? "connection-string",
        container: currentConfig.ATTACHMENT_CONTAINER_NAME,
        attachmentMode: currentConfig.ATTACHMENT_MODE,
        attachmentUrlTtlSeconds: currentConfig.ATTACHMENT_URL_TTL_SECONDS
    });
    if (currentConfig.ATTACHMENT_MODE === "mock") {
        console.warn("[runtime:processor] ATTACHMENT_MODE=mock; Genesys attachment API will not be called");
    }
    const runtime = {
        config: currentConfig,
        processor: {
            attachments: currentConfig.ATTACHMENT_MODE === "mock"
                ? new attachment_client_1.MockAttachmentClient()
                : new attachment_client_1.AttachmentClient(currentConfig),
            attachmentStore: new blob_storage_1.AzureBlobAttachmentStore(currentConfig, (0, storage_clients_1.createBlobStorageClients)(currentConfig)),
            agent: new agent_client_1.AgentClient(currentConfig)
        }
    };
    console.log("[runtime:processor] initialized");
    return runtime;
}
function getFileUploadRuntime() {
    fileUploadRuntime ??= createFileUploadRuntime();
    return fileUploadRuntime;
}
function createFileUploadRuntime() {
    const currentConfig = getConfig();
    console.log("[runtime:file-upload] initializing", {
        storageAccount: currentConfig.STORAGE_ACCOUNT_NAME ?? "connection-string",
        container: currentConfig.ATTACHMENT_CONTAINER_NAME,
        attachmentUrlTtlSeconds: currentConfig.ATTACHMENT_URL_TTL_SECONDS
    });
    const runtime = {
        config: currentConfig,
        attachmentStore: new blob_storage_1.AzureBlobAttachmentStore(currentConfig, (0, storage_clients_1.createBlobStorageClients)(currentConfig))
    };
    console.log("[runtime:file-upload] initialized");
    return runtime;
}
//# sourceMappingURL=runtime.js.map