"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:dns/promises");
const promises_2 = require("node:fs/promises");
const identity_1 = require("@azure/identity");
const storage_blob_1 = require("@azure/storage-blob");
const storage_queue_1 = require("@azure/storage-queue");
const zod_1 = require("zod");
const settingsSchema = zod_1.z.object({
    AZURE_STORAGE_CONNECTION_STRING: zod_1.z.string().min(1).optional(),
    STORAGE_ACCOUNT_NAME: zod_1.z.string().min(3).optional(),
    ATTACHMENT_CONTAINER_NAME: zod_1.z.string().min(3).default("email-attachments")
}).superRefine((settings, context) => {
    if (!settings.AZURE_STORAGE_CONNECTION_STRING && !settings.STORAGE_ACCOUNT_NAME) {
        context.addIssue({
            code: "custom",
            message: "Set STORAGE_ACCOUNT_NAME or AZURE_STORAGE_CONNECTION_STRING"
        });
    }
});
async function loadLocalSettings() {
    try {
        const content = await (0, promises_2.readFile)("local.settings.json", "utf8");
        const parsed = JSON.parse(content);
        for (const [name, value] of Object.entries(parsed.Values ?? {})) {
            if (process.env[name] === undefined && typeof value === "string") {
                process.env[name] = value;
            }
        }
        console.log("Loaded settings from local.settings.json");
    }
    catch (error) {
        if (error.code !== "ENOENT")
            throw error;
    }
}
async function checkDns(hostName) {
    const addresses = await (0, promises_1.lookup)(hostName, { all: true });
    console.log(`DNS ${hostName} -> ${addresses.map(({ address }) => address).join(", ")}`);
}
function createClients(settings, temporaryQueueName) {
    if (settings.AZURE_STORAGE_CONNECTION_STRING) {
        return {
            blobs: storage_blob_1.BlobServiceClient.fromConnectionString(settings.AZURE_STORAGE_CONNECTION_STRING),
            queue: new storage_queue_1.QueueClient(settings.AZURE_STORAGE_CONNECTION_STRING, temporaryQueueName),
            usesConnectionString: true
        };
    }
    const accountName = settings.STORAGE_ACCOUNT_NAME;
    if (!accountName)
        throw new Error("STORAGE_ACCOUNT_NAME is required");
    const credential = new identity_1.DefaultAzureCredential();
    return {
        blobs: new storage_blob_1.BlobServiceClient(`https://${accountName}.blob.core.windows.net`, credential),
        queue: new storage_queue_1.QueueClient(`https://${accountName}.queue.core.windows.net/${temporaryQueueName}`, credential),
        accountName,
        usesConnectionString: false
    };
}
async function generateReadUrl(settings, clients, blobUrl, blobName) {
    const containerName = settings.ATTACHMENT_CONTAINER_NAME;
    const startsOn = new Date(Date.now() - 5 * 60 * 1000);
    const expiresOn = new Date(Date.now() + 15 * 60 * 1000);
    const blob = clients.blobs.getContainerClient(containerName).getBlockBlobClient(blobName);
    if (clients.usesConnectionString) {
        return blob.generateSasUrl({
            permissions: storage_blob_1.BlobSASPermissions.parse("r"),
            startsOn,
            expiresOn,
            protocol: settings.AZURE_STORAGE_CONNECTION_STRING === "UseDevelopmentStorage=true"
                ? storage_blob_1.SASProtocol.HttpsAndHttp
                : storage_blob_1.SASProtocol.Https
        });
    }
    if (!clients.accountName)
        throw new Error("Storage account name is unavailable");
    const delegationKey = await clients.blobs.getUserDelegationKey(startsOn, expiresOn);
    const sas = (0, storage_blob_1.generateBlobSASQueryParameters)({
        containerName,
        blobName,
        permissions: storage_blob_1.BlobSASPermissions.parse("r"),
        startsOn,
        expiresOn,
        protocol: storage_blob_1.SASProtocol.Https
    }, delegationKey, clients.accountName).toString();
    return `${blobUrl}?${sas}`;
}
function diagnostic(error) {
    if (!(error instanceof Error))
        return "Unknown error";
    const details = error;
    return [details.name, details.code, details.statusCode, details.message]
        .filter((value) => value !== undefined && value !== "")
        .join(" | ")
        .slice(0, 1200);
}
async function main() {
    await loadLocalSettings();
    const settings = settingsSchema.parse(process.env);
    const checkId = (0, node_crypto_1.randomUUID)();
    const temporaryQueueName = `jio-wrapper-check-${Date.now()}`;
    const blobName = `connectivity-check/${checkId}.txt`;
    const testContent = `JIO wrapper connectivity check ${checkId}`;
    const clients = createClients(settings, temporaryQueueName);
    const container = clients.blobs.getContainerClient(settings.ATTACHMENT_CONTAINER_NAME);
    const blob = container.getBlockBlobClient(blobName);
    let blobCreated = false;
    let queueCreated = false;
    console.log("Storage connectivity check starting");
    console.log(`Authentication: ${clients.usesConnectionString ? "connection string" : "DefaultAzureCredential"}`);
    console.log(`Blob endpoint: ${clients.blobs.url}`);
    console.log(`Queue endpoint: ${clients.queue.url}`);
    try {
        if (clients.accountName) {
            await checkDns(`${clients.accountName}.blob.core.windows.net`);
            await checkDns(`${clients.accountName}.queue.core.windows.net`);
        }
        await container.getProperties();
        console.log(`PASS Blob container exists: ${settings.ATTACHMENT_CONTAINER_NAME}`);
        await blob.upload(testContent, Buffer.byteLength(testContent), {
            blobHTTPHeaders: { blobContentType: "text/plain" }
        });
        blobCreated = true;
        console.log("PASS Blob upload");
        const downloaded = await blob.downloadToBuffer();
        if (downloaded.toString("utf8") !== testContent) {
            throw new Error("Downloaded Blob content did not match the uploaded content");
        }
        console.log("PASS Blob download and content verification");
        const sasUrl = await generateReadUrl(settings, clients, blob.url, blobName);
        const sasResponse = await fetch(sasUrl, { signal: AbortSignal.timeout(15000) });
        if (!sasResponse.ok || await sasResponse.text() !== testContent) {
            throw new Error(`SAS download failed with HTTP ${sasResponse.status}`);
        }
        console.log("PASS Read-only SAS generation and download");
        await clients.queue.create();
        queueCreated = true;
        console.log(`PASS Temporary queue creation: ${temporaryQueueName}`);
        const messageText = JSON.stringify({ type: "connectivity-check", checkId });
        await clients.queue.sendMessage(messageText);
        const received = await clients.queue.receiveMessages({ numberOfMessages: 1, visibilityTimeout: 30 });
        const message = received.receivedMessageItems[0];
        if (!message || message.messageText !== messageText) {
            throw new Error("Queue message was not received or did not match");
        }
        await clients.queue.deleteMessage(message.messageId, message.popReceipt);
        console.log("PASS Queue send, receive, and delete");
        console.log("SUCCESS Blob and Queue connectivity checks passed");
    }
    finally {
        if (blobCreated) {
            await blob.deleteIfExists().catch((error) => {
                console.error(`WARN Could not delete test Blob: ${diagnostic(error)}`);
            });
        }
        if (queueCreated) {
            await clients.queue.delete().catch((error) => {
                console.error(`WARN Could not delete temporary queue: ${diagnostic(error)}`);
            });
        }
    }
}
main().catch((error) => {
    console.error(`FAILED ${diagnostic(error)}`);
    console.error("Check VPN/private DNS, Storage firewall rules, az login, and Blob/Queue Data Contributor roles.");
    process.exitCode = 1;
});
//# sourceMappingURL=check-storage-access.js.map