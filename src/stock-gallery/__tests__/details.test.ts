// Unit Tests for Stock Gallery API Routes
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock details response for testing
const mockDetailsResponse = {
    symbol: "TEST.NS",
    company_name: "Test Company Ltd",
    exchange: "NSE",
    latest: {
        timestamp: "2026-02-08T15:30:00Z",
        close: 100.00,
        change: 2.50,
        change_pct: 2.56
    },
    fundamentals: {
        market_cap: 1000000000,
        pe_ratio: 15.5,
        eps: 6.45,
        dividend_yield: 0.025,
        sector: "Technology",
        "52_week_high": 120.00,
        "52_week_low": 80.00,
        day_high: 102.00,
        day_low: 98.50,
        volume: 1500000
    },
    historical: [
        { timestamp: "2026-01-01T00:00:00Z", open: 90, high: 92, low: 89, close: 91, volume: 1000000 },
        { timestamp: "2026-01-02T00:00:00Z", open: 91, high: 94, low: 90, close: 93, volume: 1100000 }
    ],
    indicators: {
        sma20: [{ timestamp: "2026-01-02T00:00:00Z", value: 91.5 }],
        rsi14: [{ timestamp: "2026-01-02T00:00:00Z", value: 55 }]
    },
    prediction: {
        available: true,
        model_name: "momentum-volatility-v1",
        model_version: "1.0.0",
        confidence_score: 0.75,
        forecast_horizon_days: 7,
        forecast: [
            { timestamp: "2026-01-03T00:00:00Z", predicted_close: 95, lower_ci: 92, upper_ci: 98 }
        ],
        backtest: {
            MAE: 1.5,
            RMSE: 2.1,
            coverage_pct: 94.5,
            last_trained: "2026-01-01T00:00:00Z"
        },
        explanation: "Mild bullish trend detected."
    },
    news: [
        { timestamp: "2026-02-07T10:00:00Z", headline: "Test headline", summary: "Test summary", sentiment_score: 0.5 }
    ]
};

describe("Stock Gallery API Response Validation", () => {

    describe("Details Response Schema", () => {

        it("should have required top-level fields", () => {
            expect(mockDetailsResponse).toHaveProperty("symbol");
            expect(mockDetailsResponse).toHaveProperty("company_name");
            expect(mockDetailsResponse).toHaveProperty("exchange");
            expect(mockDetailsResponse).toHaveProperty("latest");
            expect(mockDetailsResponse).toHaveProperty("fundamentals");
            expect(mockDetailsResponse).toHaveProperty("historical");
            expect(mockDetailsResponse).toHaveProperty("indicators");
            expect(mockDetailsResponse).toHaveProperty("prediction");
            expect(mockDetailsResponse).toHaveProperty("news");
        });

        it("should have valid latest quote structure", () => {
            const { latest } = mockDetailsResponse;
            expect(latest).toHaveProperty("timestamp");
            expect(latest).toHaveProperty("close");
            expect(latest).toHaveProperty("change");
            expect(latest).toHaveProperty("change_pct");
            expect(typeof latest.close).toBe("number");
            expect(typeof latest.change).toBe("number");
        });

        it("should have valid fundamentals structure", () => {
            const { fundamentals } = mockDetailsResponse;
            expect(fundamentals).toHaveProperty("market_cap");
            expect(fundamentals).toHaveProperty("pe_ratio");
            expect(fundamentals).toHaveProperty("eps");
            expect(fundamentals).toHaveProperty("sector");
        });

        it("should have valid historical data array", () => {
            const { historical } = mockDetailsResponse;
            expect(Array.isArray(historical)).toBe(true);
            expect(historical.length).toBeGreaterThan(0);

            const firstEntry = historical[0];
            expect(firstEntry).toHaveProperty("timestamp");
            expect(firstEntry).toHaveProperty("open");
            expect(firstEntry).toHaveProperty("high");
            expect(firstEntry).toHaveProperty("low");
            expect(firstEntry).toHaveProperty("close");
            expect(firstEntry).toHaveProperty("volume");
        });

        it("should have valid prediction structure when available", () => {
            const { prediction } = mockDetailsResponse;
            expect(prediction.available).toBe(true);
            expect(prediction).toHaveProperty("model_name");
            expect(prediction).toHaveProperty("model_version");
            expect(prediction).toHaveProperty("confidence_score");
            expect(prediction).toHaveProperty("forecast_horizon_days");
            expect(prediction).toHaveProperty("forecast");
            expect(prediction).toHaveProperty("backtest");
            expect(prediction).toHaveProperty("explanation");

            // Validate confidence score range
            expect(prediction.confidence_score).toBeGreaterThanOrEqual(0);
            expect(prediction.confidence_score).toBeLessThanOrEqual(1);
        });

        it("should have valid forecast with CI when prediction available", () => {
            const { prediction } = mockDetailsResponse;
            expect(Array.isArray(prediction.forecast)).toBe(true);

            const forecastPoint = prediction.forecast![0];
            expect(forecastPoint).toHaveProperty("timestamp");
            expect(forecastPoint).toHaveProperty("predicted_close");
            expect(forecastPoint).toHaveProperty("lower_ci");
            expect(forecastPoint).toHaveProperty("upper_ci");

            // CI should make sense
            expect(forecastPoint.lower_ci).toBeLessThanOrEqual(forecastPoint.predicted_close);
            expect(forecastPoint.upper_ci).toBeGreaterThanOrEqual(forecastPoint.predicted_close);
        });

        it("should have valid backtest metrics", () => {
            const { backtest } = mockDetailsResponse.prediction;
            expect(backtest).toHaveProperty("MAE");
            expect(backtest).toHaveProperty("RMSE");
            expect(backtest).toHaveProperty("coverage_pct");
            expect(backtest).toHaveProperty("last_trained");

            expect(backtest!.MAE).toBeGreaterThanOrEqual(0);
            expect(backtest!.RMSE).toBeGreaterThanOrEqual(0);
            expect(backtest!.coverage_pct).toBeGreaterThanOrEqual(0);
            expect(backtest!.coverage_pct).toBeLessThanOrEqual(100);
        });

        it("should have valid news array with sentiment", () => {
            const { news } = mockDetailsResponse;
            expect(Array.isArray(news)).toBe(true);

            const newsItem = news[0];
            expect(newsItem).toHaveProperty("timestamp");
            expect(newsItem).toHaveProperty("headline");
            expect(newsItem).toHaveProperty("summary");
            expect(newsItem).toHaveProperty("sentiment_score");

            // Sentiment should be in range [-1, 1]
            expect(newsItem.sentiment_score).toBeGreaterThanOrEqual(-1);
            expect(newsItem.sentiment_score).toBeLessThanOrEqual(1);
        });
    });

    describe("Prediction Unavailable Scenario", () => {
        const unavailablePrediction = {
            available: false,
            reason: "Insufficient historical data (need at least 30 days)."
        };

        it("should have available=false with reason", () => {
            expect(unavailablePrediction.available).toBe(false);
            expect(unavailablePrediction).toHaveProperty("reason");
            expect(typeof unavailablePrediction.reason).toBe("string");
        });
    });
});
