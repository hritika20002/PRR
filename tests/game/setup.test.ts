import { describe, expect, it } from "vitest";

describe("Project setup", () => {
  it("runs the testing environment successfully", () => {
    expect(2 + 2).toBe(4);
  });

  it("supports TypeScript", () => {
    const projectName: string = "PLEASE REMAIN RELEVANT";

    expect(projectName).toBe("PLEASE REMAIN RELEVANT");
  });
});