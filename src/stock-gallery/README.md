# Stock Gallery Feature

A self-contained, non-invasive stock market gallery for Nexus AI with search, interactive charts, AI predictions, and news analysis.

## Quick Start

1. **Navigate to Gallery**: Click "Gallery" in the top navigation bar, or go to `/stock-gallery`
2. **Search**: Type a stock symbol or company name in the search bar
3. **Explore**: Click on a stock to view detailed charts, predictions, and news

## Features

- **Typeahead Search**: Search by symbol (e.g., "RELIANCE") or company name
- **Interactive Charts**: Price charts with SMA, EMA, RSI, Bollinger Bands overlays
- **AI Predictions**: Model-based forecasts with 95% confidence intervals
- **Fundamentals**: Key metrics including P/E, EPS, market cap, dividend yield
- **News & Sentiment**: Recent headlines with sentiment analysis

## API Endpoints

```
GET /api/stock-gallery/search?q=<query>
GET /api/stock-gallery/details?symbol=<symbol>&period=1y&interval=1d&forecast_horizon=7
```

## File Structure

```
src/stock-gallery/
├── components/          # React UI components
├── lib/                 # Core utilities (indicators, prediction, cache)
├── __tests__/           # Unit and E2E tests
└── mock/                # Sample data for testing

src/app/
├── api/stock-gallery/   # API routes
└── stock-gallery/       # Page route
```

## Running Tests

```bash
# Unit tests
npm test src/stock-gallery

# E2E tests (requires Playwright)
npx playwright test src/stock-gallery/__tests__/e2e.spec.ts
```

## Rollback

To remove this feature:
1. Delete `src/stock-gallery/` folder
2. Delete `src/app/api/stock-gallery/` folder  
3. Delete `src/app/stock-gallery/` folder
4. Remove "Gallery" link from `src/components/Navbar.tsx` (line 15)

## Dependencies

Uses existing project dependencies only:
- `recharts` - Charts
- `yahoo-finance2` - Data source
- `zod` - Validation
- `lucide-react` - Icons
