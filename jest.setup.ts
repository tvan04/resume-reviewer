import { TextEncoder, TextDecoder } from "util";

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder as typeof global.TextEncoder;
}

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

// Mock Firebase Analytics (browser-only API)
jest.mock("firebase/analytics", () => ({
  getAnalytics: jest.fn(() => ({
    logEvent: jest.fn(),
  })),
}));

// Polyfill fetch for Node environment (using node-fetch v2)
const fetch = require("node-fetch");
(global as any).fetch = fetch;


if (!global.fetch) {
  global.fetch = fetch as unknown as typeof global.fetch;
  global.Headers = Headers as unknown as typeof global.Headers;
  global.Request = Request as unknown as typeof global.Request;
  global.Response = Response as unknown as typeof global.Response;
}

import "@testing-library/jest-dom";
