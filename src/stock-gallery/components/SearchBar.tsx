"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import type { StockSearchResult } from "@/stock-gallery/lib/types";

interface SearchBarProps {
    onSelect: (result: StockSearchResult) => void;
}

export default function SearchBar({ onSelect }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<StockSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [error, setError] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced search
    const performSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 1) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/stock-gallery/search?q=${encodeURIComponent(searchQuery)}`);

            if (res.status === 429) {
                setError("Search temporarily limited; please wait a few seconds.");
                return;
            }

            if (!res.ok) throw new Error("Search failed");

            const data = await res.json();
            setResults(data.results || []);
            setShowDropdown(true);
            setSelectedIndex(-1);
        } catch (e) {
            console.error("Search error:", e);
            setError("Search failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle input change with debounce
    const handleInputChange = (value: string) => {
        setQuery(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            performSearch(value);
        }, 300);
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || results.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
                break;
            case "Escape":
                setShowDropdown(false);
                break;
        }
    };

    // Handle selection
    const handleSelect = (result: StockSearchResult) => {
        setQuery(result.symbol);
        setShowDropdown(false);
        onSelect(result);
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                !inputRef.current?.contains(e.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full max-w-lg">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warmGray" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => results.length > 0 && setShowDropdown(true)}
                    placeholder="Search stocks by symbol or company name..."
                    className="w-full pl-12 pr-12 py-4 bg-white border-2 border-charcoal/10 rounded-xl text-charcoal placeholder:text-warmGray focus:border-amber focus:outline-none transition-colors font-medium"
                    aria-label="Search stocks"
                    aria-expanded={showDropdown}
                    aria-controls="search-results"
                    aria-activedescendant={selectedIndex >= 0 ? `result-${selectedIndex}` : undefined}
                    role="combobox"
                    autoComplete="off"
                />
                {loading && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber animate-spin" />
                )}
                {!loading && query && (
                    <button
                        onClick={() => { setQuery(""); setResults([]); setShowDropdown(false); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-charcoal/5 rounded-full transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="w-4 h-4 text-warmGray" />
                    </button>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="absolute top-full mt-2 w-full p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Results Dropdown */}
            {showDropdown && results.length > 0 && (
                <div
                    ref={dropdownRef}
                    id="search-results"
                    role="listbox"
                    className="absolute top-full mt-2 w-full bg-white border-2 border-charcoal/10 rounded-xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto"
                >
                    {results.map((result, index) => (
                        <button
                            key={result.symbol}
                            id={`result-${index}`}
                            role="option"
                            aria-selected={index === selectedIndex}
                            onClick={() => handleSelect(result)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors ${index === selectedIndex ? "bg-amber/10" : "hover:bg-charcoal/5"
                                }`}
                        >
                            <div>
                                <div className="font-bold text-charcoal">{result.symbol}</div>
                                <div className="text-sm text-warmGray truncate max-w-xs">
                                    {result.company_name}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-medium text-amber">{result.exchange}</div>
                                <div className="text-xs text-warmGray">{result.sector}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No Results */}
            {showDropdown && results.length === 0 && query.length > 0 && !loading && !error && (
                <div className="absolute top-full mt-2 w-full p-4 bg-white border-2 border-charcoal/10 rounded-xl shadow-xl text-center text-warmGray">
                    No results found for "{query}"
                </div>
            )}
        </div>
    );
}
