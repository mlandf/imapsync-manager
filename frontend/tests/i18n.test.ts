import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";
import { translate } from "@/lib/i18n/context";

describe("i18n", () => {
  it("has the same keys in all languages", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
  });

  it("interpolates variables", () => {
    expect(translate(de, "jobs.description", { max: 5 })).toContain("5 Jobs");
  });
});
