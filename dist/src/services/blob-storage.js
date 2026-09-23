"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureBlobAttachmentStore = void 0;
exports.attachmentBlobName = attachmentBlobName;
exports.decodeBase64Content = decodeBase64Content;
exports.decodeAttachment = decodeAttachment;
const storage_blob_1 = require("@azure/storage-blob");
function safePathSegment(value, fallback, maxLength = 180) {
    const sanitized = value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-maxLength);
    return sanitized || fallback;
}
function safeFileName(fileName) {
    return safePathSegment(fileName, "attachment");
}
function attachmentBlobName(context, fileName) {
    const interactionId = safePathSegment(context.interactionId, "unknown-interaction", 200);
    const sourceTag = safePathSegment(context.sourceTag, "attachment", 64);
    const operationId = safePathSegment(context.operationId, "unknown-operation", 100);
    const indexPart = context.index === undefined ? "" : `-${context.index}`;
    return `interactions/${interactionId}/${sourceTag}-${operationId}${indexPart}-${safeFileName(fileName)}`;
}
function decodeBase64Content(contentBase64, maxBytes) {
    const normalized = contentBase64
        .replace(/^data:[^;]+;base64,/, "")
        .replace(/\s/g, "");
    const largestEncodedValue = Math.ceil(maxBytes / 3) * 4 + 4;
    if (normalized.length > largestEncodedValue) {
        throw new Error(`Attachment exceeds the ${maxBytes} byte limit`);
    }
    if (normalized.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
        throw new Error("Attachment API returned invalid base64");
    }
    const bytes = Buffer.from(normalized, "base64");
    if (bytes.byteLength > maxBytes) {
        throw new Error(`Attachment exceeds the ${maxBytes} byte limit`);
    }
    return bytes;
}
function decodeAttachment(attachment, maxBytes) {
    const bytes = decodeBase64Content(attachment.contentBase64, maxBytes);
    if (bytes.byteLength !== attachment.sizeBytes) {
        throw new Error("Attachment size does not match the declared sizeBytes");
    }
    return bytes;
}
class AzureBlobAttachmentStore {
    config;
    clients;
    container;
    containerReady;
    delegation;
    constructor(config, clients) {
        this.config = config;
        this.clients = clients;
        this.container = clients.blobService.getContainerClient(config.ATTACHMENT_CONTAINER_NAME);
        console.log("[blob] initializing attachment container", { container: config.ATTACHMENT_CONTAINER_NAME });
        this.containerReady = this.container.createIfNotExists();
    }
    async upload(context, attachment, ttlSeconds = this.config.ATTACHMENT_URL_TTL_SECONDS) {
        if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0 || ttlSeconds > 604200) {
            throw new Error("Attachment URL TTL must be between 1 and 604200 seconds");
        }
        console.log("[blob] upload started", {
            interactionId: context.interactionId,
            sourceTag: context.sourceTag,
            operationId: context.operationId,
            index: context.index,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            declaredBytes: attachment.sizeBytes
        });
        await this.containerReady;
        const bytes = decodeAttachment(attachment, this.config.MAX_ATTACHMENT_BYTES);
        const blobName = attachmentBlobName(context, attachment.fileName);
        const blob = this.container.getBlockBlobClient(blobName);
        await blob.uploadData(bytes, {
            blobHTTPHeaders: {
                blobContentType: attachment.mimeType,
                blobContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`
            },
            metadata: {
                interactionId: safePathSegment(context.interactionId, "unknown-interaction", 200),
                sourceTag: safePathSegment(context.sourceTag, "attachment", 64),
                operationId: safePathSegment(context.operationId, "unknown-operation", 100)
            }
        });
        console.log("[blob] upload completed", {
            interactionId: context.interactionId,
            operationId: context.operationId,
            blobName,
            bytes: bytes.byteLength
        });
        const startsOn = new Date(Date.now() - 5 * 60 * 1000);
        const expiresOn = new Date(Date.now() + ttlSeconds * 1000);
        const url = this.clients.usesSharedKey
            ? await blob.generateSasUrl({
                permissions: storage_blob_1.BlobSASPermissions.parse("r"),
                startsOn,
                expiresOn,
                protocol: storage_blob_1.SASProtocol.HttpsAndHttp
            })
            : await this.userDelegationUrl(blob.url, blobName, startsOn, expiresOn);
        console.log("[blob] read URL created", {
            interactionId: context.interactionId,
            operationId: context.operationId,
            blobName,
            expiresAt: expiresOn.toISOString(),
            usesSharedKey: this.clients.usesSharedKey
        });
        return {
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            url,
            expiresAt: expiresOn.toISOString()
        };
    }
    async userDelegationUrl(blobUrl, blobName, startsOn, expiresOn) {
        const accountName = this.clients.accountName;
        if (!accountName)
            throw new Error("Storage account name is unavailable");
        if (!this.delegation || this.delegation.expiresOn.getTime() < expiresOn.getTime() + 60_000) {
            const delegationExpiresOn = new Date(expiresOn.getTime() + 5 * 60 * 1000);
            this.delegation = {
                key: await this.clients.blobService.getUserDelegationKey(startsOn, delegationExpiresOn),
                expiresOn: delegationExpiresOn
            };
        }
        const sas = (0, storage_blob_1.generateBlobSASQueryParameters)({
            containerName: this.container.containerName,
            blobName,
            permissions: storage_blob_1.BlobSASPermissions.parse("r"),
            startsOn,
            expiresOn,
            protocol: storage_blob_1.SASProtocol.Https
        }, this.delegation.key, accountName).toString();
        return `${blobUrl}?${sas}`;
    }
}
exports.AzureBlobAttachmentStore = AzureBlobAttachmentStore;
//# sourceMappingURL=blob-storage.js.map