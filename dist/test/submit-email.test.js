"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const submit_email_1 = require("../src/functions/submit-email");
const fixtures_1 = require("./fixtures");
(0, node_test_1.default)("queues a request and returns the non-polling acknowledgement", async () => {
    let queued;
    const queue = {
        async initialize() { },
        async send(job) { queued = job; }
    };
    const response = await (0, submit_email_1.submitEmail)(fixtures_1.genesysRequest, { queue }, "fa631a28-1e13-463a-818c-21518650800c", "2026-08-21T08:00:00.000Z");
    strict_1.default.deepEqual(response, {
        interaction_id: fixtures_1.genesysRequest.interaction_id,
        status: "PENDING",
        deduped: false
    });
    strict_1.default.equal(queued?.request.interaction_id, fixtures_1.genesysRequest.interaction_id);
});
(0, node_test_1.default)("returns an error to the HTTP layer if queue publication fails", async () => {
    const queue = {
        async initialize() { },
        async send() { throw new Error("queue unavailable"); }
    };
    await strict_1.default.rejects(() => (0, submit_email_1.submitEmail)(fixtures_1.genesysRequest, { queue }), /queue unavailable/);
});
//# sourceMappingURL=submit-email.test.js.map