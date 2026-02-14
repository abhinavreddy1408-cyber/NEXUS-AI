"use client";

import { Brain, AlertTriangle, CheckCircle, Clock, TrendingUp, Info } from "lucide-react";
import type { Prediction } from "@/stock-gallery/lib/types";

interface PredictionCardProps {
    prediction: Prediction;
    onHorizonChange?: (horizon: number) => void;
    selectedHorizon?: number;
}

export default function PredictionCard({
    prediction,
    onHorizonChange,
    selectedHorizon = 7,
}: PredictionCardProps) {
    if (!prediction.available) {
        return (
            <div className="bg-white rounded-xl border-2 border-charcoal/10 p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber/10 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-amber" />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-charcoal">Prediction Unavailable</h3>
                        <p className="text-sm text-warmGray">{prediction.reason}</p>
                    </div>
                </div>
            </div>
        );
    }

    const confidenceColor =
        prediction.confidence_score! >= 0.7
            ? "text-green-600 bg-green-50"
            : prediction.confidence_score! >= 0.4
                ? "text-amber bg-amber/10"
                : "text-red-600 bg-red-50";

    const lastForecast = prediction.forecast?.[prediction.forecast.length - 1];

    return (
        <div className="bg-white rounded-xl border-2 border-charcoal/10 p-6 shadow-lg">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber/10 rounded-full flex items-center justify-center">
                        <Brain className="w-5 h-5 text-amber" />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-charcoal">AI Price Prediction</h3>
                        <p className="text-xs text-warmGray">
                            {prediction.model_name} v{prediction.model_version}
                        </p>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${confidenceColor}`}>
                    {Math.round(prediction.confidence_score! * 100)}% Confidence
                </div>
            </div>

            {/* Horizon Selector */}
            {onHorizonChange && (
                <div className="flex gap-2 mb-4">
                    {[1, 7, 30].map((horizon) => (
                        <button
                            key={horizon}
                            onClick={() => onHorizonChange(horizon)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${selectedHorizon === horizon
                                    ? "bg-charcoal text-white"
                                    : "bg-cream text-charcoal hover:bg-charcoal/10"
                                }`}
                        >
                            {horizon}D
                        </button>
                    ))}
                </div>
            )}

            {/* Forecast Summary */}
            {lastForecast && (
                <div className="bg-cream/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-amber" />
                        <span className="text-sm font-medium text-charcoal">
                            {prediction.forecast_horizon_days}-Day Forecast
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-charcoal mb-1">
                        ₹{lastForecast.predicted_close.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-warmGray">
                        95% CI: ₹{lastForecast.lower_ci.toFixed(2)} - ₹{lastForecast.upper_ci.toFixed(2)}
                    </div>
                </div>
            )}

            {/* Explanation */}
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <div className="flex gap-2">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">{prediction.explanation}</p>
                </div>
            </div>

            {/* Backtest Metrics */}
            {prediction.backtest && (
                <div className="border-t border-charcoal/10 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-charcoal">Model Backtest Metrics</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-cream/50 rounded p-2">
                            <div className="text-xs text-warmGray">MAE</div>
                            <div className="text-sm font-bold text-charcoal">₹{prediction.backtest.MAE.toFixed(2)}</div>
                        </div>
                        <div className="bg-cream/50 rounded p-2">
                            <div className="text-xs text-warmGray">RMSE</div>
                            <div className="text-sm font-bold text-charcoal">₹{prediction.backtest.RMSE.toFixed(2)}</div>
                        </div>
                        <div className="bg-cream/50 rounded p-2">
                            <div className="text-xs text-warmGray">Coverage</div>
                            <div className="text-sm font-bold text-charcoal">{prediction.backtest.coverage_pct.toFixed(1)}%</div>
                        </div>
                        <div className="bg-cream/50 rounded p-2">
                            <div className="text-xs text-warmGray">Trained</div>
                            <div className="text-sm font-bold text-charcoal">
                                {new Date(prediction.backtest.last_trained).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Low Confidence Warning */}
            {prediction.confidence_score! < 0.4 && (
                <div className="mt-4 bg-red-50 rounded-lg p-3">
                    <div className="flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <p className="text-xs text-red-800">
                            <strong>Low confidence:</strong> This prediction may be unreliable due to high volatility,
                            insufficient historical data, or unusual market conditions.
                        </p>
                    </div>
                </div>
            )}

            {/* Help Text */}
            <div className="mt-4 text-xs text-warmGray">
                <strong>What is CI?</strong> The 95% Confidence Interval shows the range where the actual price
                is likely to fall 95% of the time. Wider bands indicate higher uncertainty.
            </div>
        </div>
    );
}
