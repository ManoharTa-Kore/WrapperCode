"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const contracts_1 = require("../src/contracts");
const fixtures_1 = require("./fixtures");
(0, node_test_1.default)("accepts the documented Genesys request", () => {
    strict_1.default.deepEqual(contracts_1.genesysRequestSchema.parse(fixtures_1.genesysRequest), fixtures_1.genesysRequest);
});
(0, node_test_1.default)("does not confuse the string false with true", () => {
    const parsed = contracts_1.genesysRequestSchema.parse({ ...fixtures_1.genesysRequest, attachment: "false" });
    strict_1.default.equal(parsed.attachment === "true", false);
});
(0, node_test_1.default)("rejects boolean attachment flags and contract drift", () => {
    strict_1.default.equal(contracts_1.genesysRequestSchema.safeParse({ ...fixtures_1.genesysRequest, attachment: false }).success, false);
    strict_1.default.equal(contracts_1.genesysRequestSchema.safeParse({ ...fixtures_1.genesysRequest, unknown: "field" }).success, false);
});
(0, node_test_1.default)("validates attachmentCount against the array", () => {
    const result = contracts_1.attachmentResponseSchema.safeParse({
        ixnId: fixtures_1.genesysRequest.interaction_id,
        subject: "Subject",
        attachmentCount: 2,
        attachments: []
    });
    strict_1.default.equal(result.success, false);
});
(0, node_test_1.default)("parses queue messages serialized as JSON", () => {
    strict_1.default.deepEqual((0, contracts_1.parseEmailJob)(JSON.stringify(fixtures_1.emailJob)), fixtures_1.emailJob);
});
//# sourceMappingURL=contracts.test.js.map