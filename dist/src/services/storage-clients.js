"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBlobStorageClients = createBlobStorageClients;
exports.createQueueClient = createQueueClient;
const identity_1 = require("@azure/identity");
const storage_blob_1 = require("@azure/storage-blob");
const storage_queue_1 = require("@azure/storage-queue");
function createBlobStorageClients(config) {
    if (config.AZURE_STORAGE_CONNECTION_STRING) {
        console.log("[storage:blob] creating client with connection string", {
            container: config.ATTACHMENT_CONTAINER_NAME
        });
        return {
            blobService: storage_blob_1.BlobServiceClient.fromConnectionString(config.AZURE_STORAGE_CONNECTION_STRING),
            usesSharedKey: true
        };
    }
    if (!config.STORAGE_ACCOUNT_NAME)
        throw new Error("STORAGE_ACCOUNT_NAME is required");
    const credential = new identity_1.DefaultAzureCredential();
    const accountName = config.STORAGE_ACCOUNT_NAME;
    console.log("[storage:blob] creating client with DefaultAzureCredential", {
        accountName,
        container: config.ATTACHMENT_CONTAINER_NAME
    });
    return {
        blobService: new storage_blob_1.BlobServiceClient(`https://${accountName}.blob.core.windows.net`, credential),
        usesSharedKey: false,
        accountName
    };
}
function createQueueClient(config) {
    if (config.AZURE_STORAGE_CONNECTION_STRING) {
        console.log("[storage:queue] creating client with connection string", {
            queue: config.EMAIL_QUEUE_NAME
        });
        return new storage_queue_1.QueueClient(config.AZURE_STORAGE_CONNECTION_STRING, config.EMAIL_QUEUE_NAME);
    }
    if (!config.STORAGE_ACCOUNT_NAME)
        throw new Error("STORAGE_ACCOUNT_NAME is required");
    console.log("[storage:queue] creating client with DefaultAzureCredential", {
        accountName: config.STORAGE_ACCOUNT_NAME,
        queue: config.EMAIL_QUEUE_NAME
    });
    return new storage_queue_1.QueueClient(`https://${config.STORAGE_ACCOUNT_NAME}.queue.core.windows.net/${config.EMAIL_QUEUE_NAME}`, new identity_1.DefaultAzureCredential());
}
//# sourceMappingURL=storage-clients.js.map