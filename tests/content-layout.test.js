import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(path, "utf8");

describe("content page shared layout", () => {
  it("keeps stylesheet and shared chrome in base layout", () => {
    const baseof = read("layouts/_default/baseof.html");

    expect(baseof).toContain('<link rel="stylesheet" href="/css/main.css">');
    expect(baseof).toContain('{{ partial "header.html" . }}');
    expect(baseof).toContain('{{ partial "footer.html" . }}');
    expect(baseof).toContain('{{ block "main" . }}{{ end }}');
  });

  it("keeps About and Contact templates on the shared base layout", () => {
    const single = read("layouts/_default/single.html");
    const contact = read("layouts/contact/single.html");

    for (const template of [single, contact]) {
      expect(template).toContain('{{ define "main" }}');
      expect(template).not.toContain("<html");
      expect(template).not.toContain("<head");
      expect(template).not.toContain("stylesheet");
    }
  });
});
