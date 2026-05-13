import { describe, it, expect } from "vitest";
import { formatBytes } from "./dropzone";

describe("formatBytes", () => {
	it("returns '0 bytes' for 0 with no override", () => {
		expect(formatBytes(0)).toBe("0 bytes");
	});

	it("respects a fixed size override when bytes is 0", () => {
		expect(formatBytes(0, 2, "MB")).toBe("0 MB");
	});

	it("formats bytes under 1 KB", () => {
		expect(formatBytes(512)).toBe("512 bytes");
	});

	it("formats KB at the boundary", () => {
		expect(formatBytes(1000)).toBe("1 KB");
	});

	it("formats MB with two decimals by default", () => {
		expect(formatBytes(1_500_000)).toBe("1.5 MB");
	});

	it("respects the decimals argument", () => {
		expect(formatBytes(1_234_567, 0)).toBe("1 MB");
		expect(formatBytes(1_234_567, 3)).toBe("1.235 MB");
	});

	it("formats GB", () => {
		expect(formatBytes(2_500_000_000)).toBe("2.5 GB");
	});

	it("honours a forced unit size", () => {
		// 1_500_000 bytes expressed as KB = 1500 KB
		expect(formatBytes(1_500_000, 0, "KB")).toBe("1500 KB");
	});
});
