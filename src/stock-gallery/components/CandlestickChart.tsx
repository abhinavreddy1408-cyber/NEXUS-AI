"use client";

import { useMemo } from "react";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Area,
    ReferenceLine,
} from "recharts";
import type { OHLCV, Indicators, ForecastPoint } from "@/stock-gallery/lib/types";

interface CandlestickChartProps {
    data: OHLCV[];
    indicators: Indicators;
    forecast?: ForecastPoint[];
    enabledIndicators: {
        sma20: boolean;
        sma50: boolean;
        ema20: boolean;
        bollinger: boolean;
    };
    height?: number;
}

// Custom candlestick shape
const CandlestickBar = (props: any) => {
    const { x, y, width, payload } = props;
    if (!payload) return null;

    const { open, high, low, close } = payload;
    const isUp = close >= open;
    const color = isUp ? "#0F9D58" : "#D93025";

    const bodyTop = Math.min(open, close);
    const bodyBottom = Math.max(open, close);
    const bodyHeight = Math.max(Math.abs(close - open), 1);

    // Scale values to chart coordinates
    const scale = props.height / (props.domain[1] - props.domain[0]);
    const candleX = x + width / 2;

    return (
        <g>
            {/* Wick */}
            <line
                x1={candleX}
                x2={candleX}
                y1={y - (high - bodyBottom) * scale}
                y2={y + (bodyTop - low) * scale}
                stroke={color}
                strokeWidth={1}
            />
            {/* Body */}
            <rect
                x={x + width * 0.2}
                y={y - bodyHeight * scale / 2}
                width={width * 0.6}
                height={Math.max(bodyHeight * scale, 2)}
                fill={isUp ? color : color}
                stroke={color}
            />
        </g>
    );
};

export default function CandlestickChart({
    data,
    indicators,
    forecast = [],
    enabledIndicators,
    height = 400,
}: CandlestickChartProps) {
    // Merge historical and forecast data
    const chartData = useMemo(() => {
        // Map historical data with indicators
        const historicalWithIndicators = data.map((item, index) => {
            const timestamp = new Date(item.timestamp).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
            });

            return {
                ...item,
                timestamp,
                sma20: indicators.sma20?.find(i => i.timestamp === item.timestamp)?.value,
                sma50: indicators.sma50?.find(i => i.timestamp === item.timestamp)?.value,
                ema20: indicators.ema20?.find(i => i.timestamp === item.timestamp)?.value,
                bollingerUpper: indicators.bollinger?.upper?.find(i => i.timestamp === item.timestamp)?.value,
                bollingerMiddle: indicators.bollinger?.middle?.find(i => i.timestamp === item.timestamp)?.value,
                bollingerLower: indicators.bollinger?.lower?.find(i => i.timestamp === item.timestamp)?.value,
                isForecast: false,
                forecastClose: undefined,
                forecastUpper: undefined,
                forecastLower: undefined,
            };
        });

        // Add forecast points
        const forecastData = forecast.map(f => ({
            timestamp: new Date(f.timestamp).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
            }),
            close: f.predicted_close,
            forecastClose: f.predicted_close,
            forecastUpper: f.upper_ci,
            forecastLower: f.lower_ci,
            isForecast: true,
        }));

        return [...historicalWithIndicators, ...forecastData];
    }, [data, indicators, forecast]);

    // Calculate domain
    const domain = useMemo(() => {
        const prices = chartData.flatMap((d: any) => [
            d.high, d.low, d.close,
            d.sma20, d.sma50, d.ema20,
            d.bollingerUpper, d.bollingerLower,
            d.forecastUpper, d.forecastLower,
        ]).filter(Boolean) as number[];

        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const padding = (max - min) * 0.05;

        return [min - padding, max + padding];
    }, [chartData]);

    // Find the last historical point for reference line
    const lastHistoricalIndex = data.length - 1;

    return (
        <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis
                        dataKey="timestamp"
                        tick={{ fontSize: 10, fill: "#6B7280" }}
                        tickLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        domain={domain}
                        tick={{ fontSize: 10, fill: "#6B7280" }}
                        tickLine={false}
                        tickFormatter={(v) => `₹${v.toLocaleString()}`}
                        width={80}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#202124",
                            border: "1px solid #B06A20",
                            borderRadius: "8px",
                            color: "#F5EFE8",
                        }}
                        itemStyle={{ color: "#F5EFE8" }}
                        labelStyle={{ color: "#B06A20", fontWeight: "bold" }}
                        formatter={(value: number, name: string) => {
                            if (name === "forecastClose") return [`₹${value?.toFixed(2)}`, "Predicted"];
                            if (name === "forecastUpper") return [`₹${value?.toFixed(2)}`, "Upper CI"];
                            if (name === "forecastLower") return [`₹${value?.toFixed(2)}`, "Lower CI"];
                            return [`₹${value?.toFixed(2)}`, name.toUpperCase()];
                        }}
                    />

                    {/* Forecast CI Band */}
                    {forecast.length > 0 && (
                        <Area
                            dataKey="forecastUpper"
                            stackId="forecast"
                            stroke="none"
                            fill="#B06A20"
                            fillOpacity={0.1}
                        />
                    )}

                    {/* Bollinger Bands */}
                    {enabledIndicators.bollinger && (
                        <>
                            <Area
                                dataKey="bollingerUpper"
                                stroke="none"
                                fill="#9333EA"
                                fillOpacity={0.1}
                            />
                            <Line
                                type="monotone"
                                dataKey="bollingerUpper"
                                stroke="#9333EA"
                                strokeWidth={1}
                                dot={false}
                                strokeDasharray="2 2"
                            />
                            <Line
                                type="monotone"
                                dataKey="bollingerLower"
                                stroke="#9333EA"
                                strokeWidth={1}
                                dot={false}
                                strokeDasharray="2 2"
                            />
                        </>
                    )}

                    {/* Price Line (fallback for candlestick) */}
                    <Line
                        type="monotone"
                        dataKey="close"
                        stroke="#202124"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: "#B06A20" }}
                    />

                    {/* Forecast Line */}
                    {forecast.length > 0 && (
                        <Line
                            type="monotone"
                            dataKey="forecastClose"
                            stroke="#B06A20"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ r: 3, fill: "#B06A20" }}
                        />
                    )}

                    {/* SMA 20 */}
                    {enabledIndicators.sma20 && (
                        <Line
                            type="monotone"
                            dataKey="sma20"
                            stroke="#3B82F6"
                            strokeWidth={1.5}
                            dot={false}
                            name="SMA 20"
                        />
                    )}

                    {/* SMA 50 */}
                    {enabledIndicators.sma50 && (
                        <Line
                            type="monotone"
                            dataKey="sma50"
                            stroke="#F59E0B"
                            strokeWidth={1.5}
                            dot={false}
                            name="SMA 50"
                        />
                    )}

                    {/* EMA 20 */}
                    {enabledIndicators.ema20 && (
                        <Line
                            type="monotone"
                            dataKey="ema20"
                            stroke="#10B981"
                            strokeWidth={1.5}
                            dot={false}
                            name="EMA 20"
                        />
                    )}

                    {/* Reference line at last historical point */}
                    {forecast.length > 0 && lastHistoricalIndex >= 0 && (
                        <ReferenceLine
                            x={chartData[lastHistoricalIndex]?.timestamp}
                            stroke="#B06A20"
                            strokeDasharray="3 3"
                            label={{ value: "Forecast →", fill: "#B06A20", fontSize: 10 }}
                        />
                    )}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
