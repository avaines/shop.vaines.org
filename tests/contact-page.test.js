import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(path, "utf8");

describe("contact page layout and accessibility basics", () => {
  it("keeps Formspree submission behaviour and required field names", () => {
    const contactTemplate = read("layouts/contact/single.html");

    expect(contactTemplate).toContain('action="{{ .Site.Params.contact.formAction }}"');
    expect(contactTemplate).toContain('method="POST"');
    expect(contactTemplate).toContain('name="name"');
    expect(contactTemplate).toContain('name="email"');
    expect(contactTemplate).toContain('name="message"');
  });

  it("keeps labels and ids paired for form controls", () => {
    const contactTemplate = read("layouts/contact/single.html");

    expect(contactTemplate).toContain('label for="contact-name"');
    expect(contactTemplate).toContain('id="contact-name"');
    expect(contactTemplate).toContain('label for="contact-email"');
    expect(contactTemplate).toContain('id="contact-email"');
    expect(contactTemplate).toContain('label for="contact-message"');
    expect(contactTemplate).toContain('id="contact-message"');
  });

  it("includes responsive and focus styles for the contact layout", () => {
    const css = read("static/css/main.css");

    expect(css).toContain(".contact-layout");
    expect(css).toContain(".contact-panel");
    expect(css).toContain(".contact-form input:focus-visible");
    expect(css).toContain(".contact-form textarea:focus-visible");
    expect(css).toContain(".contact-submit:focus-visible");
    expect(css).toContain(".contact-submit:hover");
  });
});
