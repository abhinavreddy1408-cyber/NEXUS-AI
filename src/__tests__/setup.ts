// FILE: src/__tests__/setup.ts
import { expect, afterEach, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

afterEach(() => {
  cleanup();
});

class MockBroadcastChannel {
  name: string;
  onmessage: any;
  constructor(name: string) {
    this.name = name;
    this.onmessage = null;
  }
  postMessage = vi.fn();
  close = vi.fn();
}
global.BroadcastChannel = MockBroadcastChannel as any;

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

(global.fetch as any) = vi.fn((url: string | URL | Request) => {
  if (String(url) === "/api/audit") {
    return Promise.resolve({ ok: true } as any);
  }
  return Promise.reject(new Error("Unhandled fetch request"));
});
