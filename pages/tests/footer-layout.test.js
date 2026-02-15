import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(path, "utf8");

describe("footer sticky layout", () => {
  it("keeps shared layout hooks for sticky footer structure", () => {
    const baseof = read("pages/layouts/_default/baseof.html");

    expect(baseof).toContain('<main id="main-content">');
    expect(baseof).toContain('{{ partial "footer.html" . }}');
  });

  it("keeps viewport-height flex layout so footer stays at the bottom", () => {
    const css = read("pages/static/css/main.css");

    expect(css).toContain("body {");
    expect(css).toContain("min-height: 100vh;");
    expect(css).toContain("display: flex;");
    expect(css).toContain("flex-direction: column;");
    expect(css).toContain("#main-content {");
    expect(css).toContain("flex: 1;");
  });

  it("keeps grouped footer links configurable via Hugo params", () => {
    const footer = read("pages/layouts/partials/footer.html");
    const config = read("pages/config.toml");

    expect(footer).toContain("{{ range $group := $footer.groups }}");
    expect(footer).toContain("{{ if $group.external }}");
    expect(config).toContain("[[params.footer.groups]]");
    expect(config).toContain("[[params.footer.groups.links]]");
  });

  it("keeps footer hierarchy copy and scanning styles", () => {
    const footer = read("pages/layouts/partials/footer.html");
    const css = read("pages/static/css/main.css");

    expect(footer).toContain('class="footer-group-copy"');
    expect(footer).toContain('class="footer-meta"');
    expect(css).toContain(".footer-group-copy");
    expect(css).toContain(".footer-meta");
    expect(css).toContain(".footer-links a");
  });
});
