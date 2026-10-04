import { formatBytes, formatDuration, parseLines } from "@/lib/format";

describe("format", () => {
  it("formats bytes", () => {
    expect(formatBytes(null)).toBe("–");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KiB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MiB");
  });

  it("formats durations", () => {
    expect(formatDuration(42)).toBe("42s");
    expect(formatDuration(125)).toBe("2m 5s");
    expect(formatDuration(3720)).toBe("1h 2m");
    expect(formatDuration(null)).toBe("–");
  });

  it("parses lines", () => {
    expect(parseLines(" INBOX \n\n Sent\n")).toEqual(["INBOX", "Sent"]);
  });
});
