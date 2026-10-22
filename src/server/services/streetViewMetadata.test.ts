import { afterEach, describe, expect, it, vi } from "vitest";
import { findPanorama, parseMetadata, TemporaryMetadataError } from "./streetViewMetadata";

describe("parseMetadata", () => {
  it("returns the panorama position for Google's own imagery", () => {
    const reply = { status: "OK", location: { lat: 10, lng: 20 }, copyright: "© Google" };
    expect(parseMetadata(reply)).toEqual({ found: true, location: { lat: 10, lng: 20 } });
  });

  it("ignores photos uploaded by the public", () => {
    const reply = { status: "OK", location: { lat: 10, lng: 20 }, copyright: "© Jane Doe" };
    expect(parseMetadata(reply)).toEqual({ found: false });
  });

  it("treats ZERO_RESULTS as 'no Street View here'", () => {
    expect(parseMetadata({ status: "ZERO_RESULTS" })).toEqual({ found: false });
  });

  it("stops on setup problems such as a bad key", () => {
    expect(() =>
      parseMetadata({ status: "REQUEST_DENIED", error_message: "The provided API key is invalid." }),
    ).toThrow("REQUEST_DENIED");
  });

  it("rejects replies that are not shaped like Google's", () => {
    expect(() => parseMetadata({ nope: true })).toThrow();
  });

  it("marks UNKNOWN_ERROR as temporary", () => {
    expect(() => parseMetadata({ status: "UNKNOWN_ERROR" })).toThrow(TemporaryMetadataError);
  });
});

describe("findPanorama", () => {
  const point = { lat: 10, lng: 20 };
  const reply = (body: object) => new Response(JSON.stringify(body), { status: 200 });

  // Replaces the real fetch with a fake that returns these replies in order (no internet needed).
  function fakeGoogle(...replies: Response[]) {
    const fake = vi.fn();
    replies.forEach((response) => fake.mockResolvedValueOnce(response));
    vi.stubGlobal("fetch", fake);
    return fake;
  }

  afterEach(() => vi.unstubAllGlobals());

  it("tries again after a temporary Google error", async () => {
    const fake = fakeGoogle(
      reply({ status: "UNKNOWN_ERROR" }),
      new Response("", { status: 503 }),
      reply({ status: "OK", location: point, copyright: "© Google" }),
    );
    await expect(findPanorama(point, 1000, "test-key", 0)).resolves.toEqual({ found: true, location: point });
    expect(fake).toHaveBeenCalledTimes(3);
  });

  it("gives up after 4 temporary errors in a row", async () => {
    const fake = fakeGoogle(...Array.from({ length: 4 }, () => reply({ status: "UNKNOWN_ERROR" })));
    await expect(findPanorama(point, 1000, "test-key", 0)).rejects.toThrow("UNKNOWN_ERROR");
    expect(fake).toHaveBeenCalledTimes(4);
  });

  it("does not retry setup problems", async () => {
    const fake = fakeGoogle(reply({ status: "REQUEST_DENIED" }));
    await expect(findPanorama(point, 1000, "test-key", 0)).rejects.toThrow("REQUEST_DENIED");
    expect(fake).toHaveBeenCalledTimes(1);
  });
});
