import { formToJob, formToProfile, jobFormSchema, jobToForm, profileFormSchema } from "@/lib/schemas";

describe("profile schema", () => {
  it("accepts empty port and converts to null", () => {
    const values = profileFormSchema.parse({
      name: "A", host: "10.0.0.1", port: "", security: "ssl", authmech: "", timeout: "",
    });
    expect(formToProfile(values)).toMatchObject({ port: null, authmech: null, timeout: null });
  });

  it("rejects invalid port and host", () => {
    const base = { name: "A", security: "ssl", authmech: "", timeout: "" };
    expect(profileFormSchema.safeParse({ ...base, host: "h", port: "70000" }).success).toBe(false);
    expect(profileFormSchema.safeParse({ ...base, host: "a b", port: "" }).success).toBe(false);
  });
});

describe("job schema", () => {
  it("round-trips options", () => {
    const form = {
      ...jobToForm(),
      name: "Job",
      source_profile_id: "1",
      source_user: "a",
      target_profile_id: "2",
      target_user: "b",
      folders: "INBOX\nSent",
      max_age_days: "30",
      folder_mappings: [{ source: "Sent", target: "Gesendet" }, { source: "", target: "" }],
    };
    const input = formToJob(jobFormSchema.parse(form));
    expect(input.source_password).toBeNull();
    expect(input.options.folders).toEqual(["INBOX", "Sent"]);
    expect(input.options.max_age_days).toBe(30);
    expect(input.options.min_age_days).toBeNull();
    expect(input.options.folder_mappings).toHaveLength(1);
  });
});
