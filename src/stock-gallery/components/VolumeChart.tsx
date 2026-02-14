"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { OHLCV } from "@/stock-gallery/lib/types";

interface VolumeChartProps {
    data: OHLCV[];
    height?: number;
}

export default function VolumeChart({ data, height = 100 }: VolumeChartProps) {
    const chartData = useMemo(() => {
        return data.map((item, index) => {
            const isUp = index === 0 ? true : item.close >= data[index - 1].close;
            return {
                timestamp: new Date(item.timestamp).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                }),
                volume: item.volume,
                fill: isUp ? "#0F9D58" : "#D93025",
            };
        });
    }, [data]);

    return (
        <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                    <XAxis
                        dataKey="timestamp"
                        tick={{ fontSize: 9, fill: "#6B7280" }}
                        tickLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tick={{ fontSize: 9, fill: "#6B7280" }}
                        tickLine={false}
                        tickFormatter={(v) => {
                            if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                            if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                            return v.toString();
                        }}
                        width={50}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#202124",
                            border: "1px solid #B06A20",
                            borderRadius: "8px",
                            color: "#F5EFE8",
                            fontSize: "12px",
                        }}
                        formatter={(value: number) => [value.toLocaleString(), "Volume"]}
                    />
                    <Bar dataKey="volume" fill="#B06A20" opacity={0.7} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
