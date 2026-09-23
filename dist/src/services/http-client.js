"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalHttpError = void 0;
exports.requestJson = requestJson;
exports.bearerHeader = bearerHeader;
class ExternalHttpError extends Error {
    service;
    status;
    responsePreview;
    constructor(service, status, responsePreview) {
        super(`${service} returned HTTP ${status}`);
        this.service = service;
        this.status = status;
        this.responsePreview = responsePreview;
    }
}
exports.ExternalHttpError = ExternalHttpError;
function property(value, name) {
    if (typeof value !== "object" || value === null)
        return undefined;
    return value[name];
}
function errorDetails(error) {
    const top = error instanceof Error ? error : undefined;
    const cause = top?.cause;
    const causeError = cause instanceof Error ? cause : undefined;
    const details = {
        error: top ? `${top.name}: ${top.message}` : String(error),
        stack: top?.stack
    };
    if (causeError) {
        details.cause = `${causeError.name}: ${causeError.message}`;
        details.causeStack = causeError.stack;
    }
    for (const name of ["code", "errno", "syscall", "hostname", "address", "port"]) {
        const value = property(cause, name) ?? property(error, name);
        if (typeof value === "string" || typeof value === "number")
            details[name] = value;
    }
    return details;
}
function safeUrl(value) {
    try {
        const parsed = new URL(value);
        return `${parsed.origin}${parsed.pathname}`;
    }
    catch {
        return "[invalid-url]";
    }
}
async function requestJson(service, url, init, timeoutMs, context) {
    const startedAt = Date.now();
    const requestLog = { service, method: init.method ?? "GET", url: safeUrl(url) };
    console.log("[http] request started", requestLog);
    context?.log(`[http] request started ${JSON.stringify(requestLog)}`);
    try {
        const response = await fetch(url, {
            ...init,
            signal: AbortSignal.timeout(timeoutMs)
        });
        const text = await response.text();
        const responseLog = {
            service,
            status: response.status,
            durationMs: Date.now() - startedAt,
            responseBytes: Buffer.byteLength(text)
        };
        console.log("[http] response received", responseLog);
        context?.log(`[http] response received ${JSON.stringify(responseLog)}`);
        if (!response.ok) {
            throw new ExternalHttpError(service, response.status, text.slice(0, 500));
        }
        if (!text)
            return { status: response.status, body: {} };
        try {
            return { status: response.status, body: JSON.parse(text) };
        }
        catch {
            return { status: response.status, body: { raw: text.slice(0, 2000) } };
        }
    }
    catch (error) {
        const failureLog = {
            service,
            method: init.method ?? "GET",
            url: safeUrl(url),
            durationMs: Date.now() - startedAt,
            ...errorDetails(error)
        };
        console.error("[http] request failed", failureLog);
        context?.error(`[http] request failed ${JSON.stringify(failureLog)}`);
        throw error;
    }
}
function bearerHeader(apiKey) {
    return apiKey ? { authorization: `Bearer ${apiKey}` } : {};
}
//# sourceMappingURL=http-client.js.map