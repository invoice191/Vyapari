import { describe, expect, it } from "vitest";
import {
  buildSimulationResult,
  validateOCRRequest,
  validateSimulationRequest,
} from "../server/apiValidation";

describe("api validation", () => {
  it("rejects malformed OCR requests", () => {
    expect(validateOCRRequest({ imageUrl: "" })).toEqual(["imageUrl is required."]);
    expect(validateOCRRequest({ imageUrl: "ftp://bad-url" })).toEqual([
      "imageUrl must be an http(s) URL, data URI, or supported file path.",
    ]);
  });

  it("rejects invalid simulation requests", () => {
    expect(validateSimulationRequest({ parameters: { price: 0, volume: -1, seasonality: 3 } })).toEqual([
      "parameters.price must be greater than zero.",
      "parameters.volume must be greater than zero.",
      "parameters.seasonality must be between 0 and 2.",
    ]);
  });

  it("builds a valid simulation response structure", () => {
    (globalThis as any).__DETERMINISTIC_TEST__ = true;
    const result = buildSimulationResult({
      parameters: { price: 10, volume: 100, seasonality: 1.2, growthRate: 0.2 },
    });
    
    expect(result.summary.predictedRevenue).toBe(1440);
    expect(result.summary.demandTrend).toBe("increase");
    expect(result.chartData).toHaveLength(12);
    expect(result.recommendations).toHaveLength(5);
    delete (globalThis as any).__DETERMINISTIC_TEST__;
  });
});
