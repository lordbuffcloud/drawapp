import { describe, expect, it } from "vitest";
import { getServerEnv } from "./env";

describe("env", () => {
  it("throws when required vars are missing", () => {
    const old = process.env;
    process.env = {} as NodeJS.ProcessEnv;
    expect(() => getServerEnv()).toThrow(/Missing\/invalid server env vars/);
    process.env = old;
  });
});


