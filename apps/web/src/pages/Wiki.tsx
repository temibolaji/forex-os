import { useState, useMemo } from 'react';
import { Search, Book, HelpCircle, ChevronRight, Award, Lightbulb, Compass, ShieldAlert, Layers } from 'lucide-react';

interface WikiTerm {
  term: string;
  category: 'Basics' | 'Technical' | 'Fundamental' | 'Risk' | 'Orders';
  definition: string;
  example: string;
  proTip: string;
}

const FOREX_TERMS: WikiTerm[] = [
  // Basics
  {
    term: 'Pip (Percentage in Point)',
    category: 'Basics',
    definition: 'The smallest standard price unit movement in a currency pair. For most major pairs, it is equivalent to 1/100 of 1% (0.0001). For Japanese Yen (JPY) pairs, it represents 1% (0.01).',
    example: 'If EUR/USD rises from 1.0850 to 1.0851, it has moved up by 1 pip. If USD/JPY moves from 154.20 to 154.21, it has moved up by 1 pip.',
    proTip: 'Be careful with fractional pips (pipettes), which are the 5th decimal place (or 3rd for JPY pairs) and represent 1/10 of a pip.'
  },
  {
    term: 'Pipette (Fractional Pip)',
    category: 'Basics',
    definition: 'A fractional pip unit equal to 1/10th of a standard pip. It is displayed as a superscript or smaller final digit in exchange rates (the 5th decimal place for standard pairs, or 3rd for JPY pairs).',
    example: 'If GBP/USD moves from 1.25000 to 1.25004, it has advanced by 4 pipettes (0.4 pips).',
    proTip: 'Pipettes allow for tighter spreads and more precise price quotes from institutional liquidity providers.'
  },
  {
    term: 'Spread',
    category: 'Basics',
    definition: 'The difference between the bid (selling) price and the ask (buying) price of a currency pair. This represents the primary cost of entering a transaction, pocketed by the broker.',
    example: 'If the bid price for EUR/USD is 1.0850 and the ask price is 1.0851, the spread is 1 pip (0.0001).',
    proTip: 'Spreads tend to widen significantly during high-impact news releases or during low-liquidity periods, such as the market crossover at 5:00 PM EST.'
  },
  {
    term: 'Leverage',
    category: 'Basics',
    definition: 'The ability to control a large amount of capital using a relatively small amount of your own money. It is expressed as a ratio (e.g., 50:1, 100:1, 500:1).',
    example: 'With 100:1 leverage, you can control a $100,000 position (1 standard lot) with a margin deposit of just $1,000.',
    proTip: 'Leverage is a double-edged sword. It magnifies both your potential profits and your potential losses.'
  },
  {
    term: 'Margin',
    category: 'Basics',
    definition: 'The required collateral deposit needed to open and maintain leveraged trading positions. Margin is not a transaction fee, but a portion of account equity locked in place while a trade is open.',
    example: 'If your broker requires 1% margin for EUR/USD, you must maintain at least $1,000 in free margin to hold a position size of $100,000.',
    proTip: 'Always monitor your Free Margin. If your account equity falls below the broker\'s required maintenance margin, you will trigger a margin call and positions may be liquidated.'
  },
  {
    term: 'Base & Quote Currencies',
    category: 'Basics',
    definition: 'In any currency pair, the first currency is the Base Currency and the second is the Quote (or Term) Currency. The exchange rate represents how much of the quote currency is needed to buy one unit of the base currency.',
    example: 'In the EUR/USD pair, EUR is the Base currency and USD is the Quote currency. If the rate is 1.0800, you need 1.0800 USD to buy 1 EUR.',
    proTip: 'Your trading P&L is always calculated in the Quote currency and then converted to your account\'s base currency.'
  },
  {
    term: 'Lot Size',
    category: 'Basics',
    definition: 'The standard measurement of unit volume for currency transactions. A Standard Lot is 100,000 units of the base currency; a Mini Lot is 10,000 units; a Micro Lot is 1,000 units.',
    example: 'Buying 0.1 Standard Lots of GBP/USD means you are purchasing 10,000 GBP (1 Mini Lot).',
    proTip: 'Ensure you size your lots accurately using a position sizer to match your targeted monetary risk.'
  },
  {
    term: 'Bullish & Bearish',
    category: 'Basics',
    definition: 'Market sentiment descriptors. Bullish indicates an expectation that prices will rise, while Bearish indicates an expectation that prices will fall.',
    example: 'Traders are bullish on the USD due to high interest rates, while remaining bearish on the EUR due to economic slowdown.',
    proTip: 'Do not let personal bias make you purely bullish or bearish. Let key horizontal levels dictate your actual execution bias.'
  },
  {
    term: 'Long & Short Positions',
    category: 'Basics',
    definition: 'Long represents buying an asset with the expectation that its price will appreciate. Short represents selling a borrowed asset (or contract) with the expectation that its price will depreciate.',
    example: 'Going Long EUR/USD means buying Euros and selling US Dollars. Going Short means selling Euros and buying US Dollars.',
    proTip: 'Shorting in forex is just as easy as buying because you are always trading one currency relative to another.'
  },
  {
    term: 'Currency Crosses (Cross Pairs)',
    category: 'Basics',
    definition: 'Currency pairs that do not involve the US Dollar. These are calculated by crossing the respective major pairs against the USD.',
    example: 'EUR/GBP, GBP/JPY, and EUR/AUD are classic examples of Currency Crosses.',
    proTip: 'Cross pairs can offer cleaner technical structures when the USD is ranging in a messy, unpredictable consolidation.'
  },
  {
    term: 'Exotic Currency Pairs',
    category: 'Basics',
    definition: 'Currency pairs consisting of one major global currency matched with the currency of a developing or emerging market economy.',
    example: 'USD/TRY (US Dollar / Turkish Lira) or USD/MXN (US Dollar / Mexican Peso) are Exotic pairs.',
    proTip: 'Exotics carry extremely high spreads, high overnight swap charges, and are highly volatile. They are generally not recommended for beginners.'
  },
  {
    term: 'Slippage',
    category: 'Basics',
    definition: 'The difference between the expected entry/exit price of a trade and the actual price at which the broker executes the order. This typically occurs during periods of extreme market volatility.',
    example: 'You try to buy EUR/USD at 1.0800 during a news release, but because of a rapid price gap, your order is executed at 1.0805. You experienced 5 pips of slippage.',
    proTip: 'Limit orders can protect you from entry slippage, but stop losses on market execution orders are always prone to it during massive news events.'
  },
  {
    term: 'Going Flat',
    category: 'Basics',
    definition: 'Closing all active and pending trades to have zero market exposure. Traders go flat to avoid weekend gaps, major economic announcements, or when they hit their maximum loss limits.',
    example: 'A trader closes all open positions at 4:30 PM EST on Friday to go flat over the weekend.',
    proTip: 'Going flat is an active risk management decision. Doing nothing in a highly uncertain market is often the most profitable action.'
  },
  {
    term: 'Major Pairs (The Majors)',
    category: 'Basics',
    definition: 'The seven most heavily traded currency pairs in the world, representing the global economic powers. They all contain the US Dollar as either the base or quote currency.',
    example: 'EUR/USD, GBP/USD, USD/JPY, USD/CHF, USD/CAD, AUD/USD, and NZD/USD make up the Majors.',
    proTip: 'Major pairs represent over 80% of daily forex volume and offer the lowest spreads, highest liquidity, and most reliable technical patterns.'
  },
  {
    term: 'Cable (GBP/USD)',
    category: 'Basics',
    definition: 'A slang term in the financial markets representing the exchange rate between the British Pound and the US Dollar.',
    example: 'A trader says, "I am looking to buy the Cable at support around 1.2500."',
    proTip: 'The term originated in the mid-19th century when rates were transmitted across the Atlantic via a deep-sea telegraph cable.'
  },
  {
    term: 'Fiber (EUR/USD)',
    category: 'Basics',
    definition: 'A popular trading floor slang term for the EUR/USD currency pair.',
    example: 'A market analyst notes that the Fiber is breaking out above its weekly resistance band.',
    proTip: 'Named as a play on "Cable" because Europe boasts some of the most extensive fiber-optic networks in the world.'
  },
  {
    term: 'Swissy (USD/CHF)',
    category: 'Basics',
    definition: 'Market slang representing the US Dollar paired with the Swiss Franc (CHF) exchange rate.',
    example: 'Traders run to the Swissy during economic uncertainty as CHF acts as a safety anchor.',
    proTip: 'The Swiss Franc is considered one of the most stable currencies globally due to Switzerland\'s historical neutrality and massive gold reserves.'
  },
  {
    term: 'Loonie (USD/CAD)',
    category: 'Basics',
    definition: 'Financial market slang representing the USD/CAD exchange rate.',
    example: 'A spike in crude oil prices pushes the Loonie higher (meaning CAD gains, causing USD/CAD to fall).',
    proTip: 'Derived from the picture of a common loon bird depicted on Canada\'s single dollar coin.'
  },
  {
    term: 'Kiwi (NZD/USD)',
    category: 'Basics',
    definition: 'Market slang representing the New Zealand Dollar paired with the US Dollar.',
    example: 'The Kiwi drops after the Reserve Bank of New Zealand announces a dovish inflation policy.',
    proTip: 'Named after New Zealand\'s national symbol: the flightless Kiwi bird shown on their $1 coin.'
  },
  {
    term: 'Aussie (AUD/USD)',
    category: 'Basics',
    definition: 'Slang representing the Australian Dollar paired with the US Dollar exchange rate.',
    example: 'A rising demand for copper and iron ore typically supports a strong Aussie.',
    proTip: 'Australia is a commodity-export heavy country, making the Aussie heavily correlated to global industrial raw material prices.'
  },
  {
    term: 'Exchange Rate',
    category: 'Basics',
    definition: 'The relative value of one nation\'s currency expressed in terms of another nation\'s currency.',
    example: 'If the USD/JPY exchange rate is 150.00, it means 1 US Dollar is worth exactly 150.00 Japanese Yen.',
    proTip: 'Exchange rates are driven by interest differentials, economic indicators, and capital flows.'
  },
  {
    term: 'Market Liquidity',
    category: 'Basics',
    definition: 'The volume and frequency of trading activity in a market, indicating how easily a large position can be entered or exited at the exact requested price without causing major price disruption.',
    example: 'The EUR/USD pair has the highest liquidity in the world, ensuring virtually instant order execution.',
    proTip: 'Low-liquidity assets are prone to sudden, violent price gaps and wide spreads.'
  },
  {
    term: 'Market Volatility',
    category: 'Basics',
    definition: 'The rate and magnitude of price fluctuations in a financial instrument over a given timeframe.',
    example: 'Gold (XAU/USD) is known for high volatility, frequently moving 200+ pips within minutes during economic data drops.',
    proTip: 'Volatility is where opportunity lies, but without strict risk limits, high volatility will quickly drain an account.'
  },
  {
    term: 'Bid & Ask Price',
    category: 'Basics',
    definition: 'The two prices quoted for any asset. The Bid is the maximum price buyers are willing to pay (the price you receive to sell). The Ask is the minimum price sellers are willing to accept (the price you pay to buy).',
    example: 'If EUR/USD is quoted as 1.0820 / 1.0822, 1.0820 is the Bid and 1.0822 is the Ask.',
    proTip: 'Always remember: you buy at the higher price (Ask) and sell at the lower price (Bid).'
  },
  {
    term: 'Over-The-Counter (OTC)',
    category: 'Basics',
    definition: 'A decentralized market structure where trades are conducted directly between two parties (such as banks or brokers) without a centralized physical exchange clearing house.',
    example: 'The entire foreign exchange market operates as a global OTC network.',
    proTip: 'Because forex is OTC, there is no single central volume metric; volume must be compiled from individual broker feeds.'
  },
  {
    term: 'Spot Market',
    category: 'Basics',
    definition: 'A financial market where financial instruments are traded for immediate settlement and physical delivery at the current prevailing cash rate.',
    example: 'Retail forex traders trade in the spot market, settling contracts instantly at the current tick valuation.',
    proTip: 'Spot transactions are distinct from futures and forward markets, which contract for delivery at a specific date in the future.'
  },
  
  // Technical Analysis
  {
    term: 'Support',
    category: 'Technical',
    definition: 'A price level where a downtrend tends to pause due to a high concentration of buying demand. Buyers see value at this level and step in, pushing prices back up.',
    example: 'EUR/USD falls to 1.0500 three times over a month and bounces off it each time. 1.0500 is a significant Support level.',
    proTip: 'The more times a support level is tested, the weaker it tends to become as buy orders are consumed.'
  },
  {
    term: 'Resistance',
    category: 'Technical',
    definition: 'A price level where an uptrend tends to pause because sellers step in with supply. It acts as a ceiling that price struggles to break above.',
    example: 'Gold rallies to $2,400 but repeatedly retreats as heavy selling orders are triggered at that exact level.',
    proTip: 'When resistance is broken, it frequently flips and acts as a new support level during subsequent pullbacks.'
  },
  {
    term: 'Candlestick Chart',
    category: 'Technical',
    definition: 'A visual style of charting that displays the open, high, low, and close prices for a specific time interval. The "body" represents open to close, and the "wicks" represent high and low extremes.',
    example: 'A 1-hour bullish candle shows a green body with the bottom as the open, the top as the close, and thin lines extending to show the highs/lows.',
    proTip: 'Candlestick patterns (like Pinbars, Engulfing bars, or Dojis) are most powerful when they appear at key support or resistance zones.'
  },
  {
    term: 'Moving Average (MA)',
    category: 'Technical',
    definition: 'A trend-following indicator that smooths out price volatility by calculating the average price over a specified number of past periods.',
    example: 'The 200-day Simple Moving Average (SMA) compiles the closing prices of the last 200 days and acts as an anchor for long-term trend direction.',
    proTip: 'The 20-period Exponential Moving Average (EMA) reacts faster to price changes than the SMA, making it helpful for short-term momentum trading.'
  },
  {
    term: 'RSI (Relative Strength Index)',
    category: 'Technical',
    definition: 'A momentum oscillator that measures the speed and change of price movements, ranging from 0 to 100. It is traditionally used to identify overbought (>70) or oversold (<30) conditions.',
    example: 'An RSI reading of 82 indicates a highly extended rally that may be prone to a cooling-off period or dynamic reversal.',
    proTip: 'RSI divergence (where price makes higher highs but RSI makes lower highs) is a premium indicator of trend exhaustion.'
  },
  {
    term: 'Fibonacci Retracement',
    category: 'Technical',
    definition: 'A charting tool based on mathematical ratios (23.6%, 38.2%, 50%, 61.8%, 78.6%) derived from the Fibonacci sequence. It is used to identify potential support and resistance levels during a pullback of an active trend.',
    example: 'EUR/USD rallies from 1.0500 to 1.1000, then pulls back exactly to 1.0750 (the 50% retracement level) and resumes its upward trend.',
    proTip: 'The 61.8% level is widely referred to as the "Golden Pocket" and represents one of the highest-probability entry zones in technical analysis.'
  },
  {
    term: 'Trendline',
    category: 'Technical',
    definition: 'A straight diagonal line drawn on a price chart connecting consecutive pivot highs (in a downtrend) or pivot lows (in an uptrend) to visualize the current market path and speed.',
    example: 'Drawing a line connecting three ascending swing lows in USD/CAD to identify the bullish channel structure.',
    proTip: 'A trendline requires at least two points to be drawn, but is only validated once price touches it for a third time.'
  },
  {
    term: 'Breakout',
    category: 'Technical',
    definition: 'When price moves out of an established consolidation range, chart pattern, or breaks past a major horizontal level accompanied by an increase in volume or momentum.',
    example: 'EUR/USD consolidates between 1.0800 and 1.0850 for a week, then explosively candles up to 1.0920 in a single hour.',
    proTip: 'Many breakouts fail. A more conservative approach is to wait for the breakout candle to close, then enter on a retest of the broken boundary.'
  },
  {
    term: 'Confluence',
    category: 'Technical',
    definition: 'The overlapping of multiple technical analysis tools (e.g., support/resistance, Fibonacci, moving averages) at the exact same price zone, heavily increasing the probability of a successful trade.',
    example: 'Entering a long position at a horizontal support level that aligns perfectly with a 200 EMA and a 61.8% Fibonacci retracement level.',
    proTip: 'Confluence is the secret of professional traders. The more independent reasons you have to take a trade, the higher your long-term win rate will be.'
  },
  {
    term: 'Average True Range (ATR)',
    category: 'Technical',
    definition: 'A volatility indicator that measures the average range of price movement over a specified number of periods (usually 14). It does not indicate direction, only the average extent of volatility.',
    example: 'If the Daily ATR of GBP/USD is 120 pips, it indicates that the pair typically travels 120 pips from high to low within a 24-hour cycle.',
    proTip: 'Use ATR to set smart Stop Loss levels. Setting your SL at 1.5x to 2x the ATR prevents you from getting prematurely stopped out by normal market noise.'
  },
  {
    term: 'Divergence',
    category: 'Technical',
    definition: 'A technical scenario where the price of a currency pair moves in the opposite direction of a momentum indicator (such as RSI or MACD), signifying a potential loss of trend strength.',
    example: 'EUR/USD rallies to a higher high on the daily chart, but the RSI makes a lower high. This indicates bearish momentum divergence.',
    proTip: 'Divergence is not an immediate trigger to enter a trade, but rather a warning sign to tighten stops or look for an exit trigger.'
  },
  {
    term: 'Double Top & Double Bottom',
    category: 'Technical',
    definition: 'High-reliability reversal patterns. A Double Top consists of two peak highs at a similar level signaling resistance, followed by a breakdown. A Double Bottom consists of two trough lows signaling support, followed by a breakout.',
    example: 'GBP/USD attempts to clear 1.3000 twice, fails both times, breaks its neckline support, and collapses 200 pips.',
    proTip: 'Measure the height of the pattern and project it downwards from the broken neckline support to find your ideal target profit level.'
  },
  {
    term: 'Head and Shoulders (H&S)',
    category: 'Technical',
    definition: 'A classic bearish reversal pattern featuring three consecutive peaks: a left shoulder, a higher middle peak (the head), and a right shoulder of similar height to the first, followed by a break of neckline support.',
    example: 'EUR/USD prints an H&S structure on the 4-hour chart, signaling the transition from an uptrend to a downtrend.',
    proTip: 'An Inverse Head and Shoulders pattern operates as the bullish equivalent, showing a transition from a downtrend to an uptrend.'
  },
  {
    term: 'Neckline',
    category: 'Technical',
    definition: 'The support or resistance level drawn across the reaction lows or highs of a head and shoulders or double top/bottom pattern, acting as the final breakout boundary.',
    example: 'A horizontal support line drawn across the troughs of an H&S pattern. Breaking this neckline is the active short entry signal.',
    proTip: 'Always wait for the breakout candle to close past the neckline on your trading timeframe before executing your entry.'
  },
  {
    term: 'Engulfing Candle',
    category: 'Technical',
    definition: 'A multi-candle candlestick reversal pattern. A Bullish Engulfing pattern features a red candle followed by a larger green candle whose body completely covers the first body. A Bearish Engulfing is the opposite.',
    example: 'A massive daily bearish engulfing candle triggers at a weekly resistance zone on GBP/USD, starting a two-week downtrend.',
    proTip: 'Engulfing candles are highly reliable when they emerge at major structural extremes, but are mostly noise when trapped in tight consolidations.'
  },
  {
    term: 'Doji',
    category: 'Technical',
    definition: 'A candlestick pattern where the opening and closing prices are virtually identical, resulting in a very small body with long wicks, indicating absolute market indecision.',
    example: 'Gold forms a daily Doji candle at an all-time high, indicating a temporary equilibrium and a potential pause in trend.',
    proTip: 'A Doji indicates that a struggle occurred between buyers and sellers, but neither side gained control. Look for the next candle close to confirm direction.'
  },
  {
    term: 'Pin Bar (Hammer / Shooting Star)',
    category: 'Technical',
    definition: 'A single-candle pattern featuring a small body at one extreme and a long wick extending to the opposite side, showing an active rejection of that price extreme.',
    example: 'EUR/USD spikes down to support, but buyers step in, pushing price up to close near the high, leaving a pin bar with a long lower wick.',
    proTip: 'The long tail of the pin bar represents the "trap". Retail stop losses were targeted, orders were filled, and institutional smart money reversed the price.'
  },
  {
    term: 'Bollinger Bands',
    category: 'Technical',
    definition: 'A volatility channel indicator consisting of a Simple Moving Average (usually 20 periods) and two outer bands plotted at standard deviation extremes above and below the SMA.',
    example: 'When volatility drops, the Bollinger Bands contract into a tight squeeze, indicating an imminent explosive breakout.',
    proTip: 'Avoid buying blindly when price touches the upper band. Strong trends can "walk the bands" for long periods.'
  },
  {
    term: 'Stochastic Oscillator',
    category: 'Technical',
    definition: 'A range-bound momentum indicator comparing the current closing price of a currency pair to its price range over a specified number of periods, ranging from 0 to 100.',
    example: 'A Stochastic reading above 80 indicates overbought conditions, while a crossover below 80 is the active short entry trigger.',
    proTip: 'Like all momentum oscillators, Stochastics can remain pinned in overbought/oversold extremes for long periods during strong, secular trends.'
  },
  {
    term: 'Average Directional Index (ADX)',
    category: 'Technical',
    definition: 'A trend strength indicator ranging from 0 to 100. It measures the velocity of a trend without indicating its directional bias.',
    example: 'An ADX reading of 35 indicates a highly robust trend is active, suggesting you should focus purely on trend-following pullbacks.',
    proTip: 'An ADX below 20 indicates a weak, ranging market; avoid trend-following strategies during this phase.'
  },
  {
    term: 'Pivot Points',
    category: 'Technical',
    definition: 'A mathematically calculated index representing the average of the high, low, and closing prices from the prior session, used to project key intraday support and resistance levels.',
    example: 'Intraday traders buy AUD/USD exactly at the daily S1 Pivot support and exit at the daily R1 Pivot resistance.',
    proTip: 'Pivot points are highly respected because they are objective mathematical levels visible to all market participants at the start of the day.'
  },
  {
    term: 'Market Consolidation',
    category: 'Technical',
    definition: 'A market phase where price ranges sideways in a horizontal channel with low volume, indicating a temporary balance between buyers and sellers.',
    example: 'GBP/USD moves sideways between 1.2500 and 1.2530 for two days before an FOMC interest announcement.',
    proTip: 'Consolidation is the spring coiling. The longer the market consolidates, the more violent the eventual breakout will be.'
  },
  {
    term: 'Fakeout (False Breakout)',
    category: 'Technical',
    definition: 'A market manipulation trap where price breaks past a key level, triggering pending orders and draw-in retail participants, only to rapidly reverse and head in the opposite direction.',
    example: 'EUR/USD spikes above a daily resistance level of 1.1000, triggers buy stop orders, then collapses down to 1.0950 within an hour.',
    proTip: 'To avoid fakeouts, wait for a candle to close outside the range on your trading timeframe before entering.'
  },
  {
    term: 'Higher High & Higher Low (HH/HL)',
    category: 'Technical',
    definition: 'The fundamental price action sequence that defines a structural uptrend. Price rallies past its prior peak (HH) and pullbacks stop above the prior low (HL).',
    example: 'EUR/USD trades from 1.05 (Low) -> 1.07 (HH) -> 1.06 (HL) -> 1.09 (HH). This is a textbook uptrend structure.',
    proTip: 'Always focus on buying at the higher low (HL) pullback rather than chasing a breakout at the higher high (HH).'
  },
  {
    term: 'Lower High & Lower Low (LH/LL)',
    category: 'Technical',
    definition: 'The fundamental price action sequence that defines a structural downtrend. Price drops below the prior trough (LL) and corrective bounces stop below the prior peak (LH).',
    example: 'Gold trades from 2000 (High) -> 1950 (LL) -> 1980 (LH) -> 1920 (LL). This is a textbook downtrend structure.',
    proTip: 'Look for short entries near the lower high (LH) pullbacks where you can place a tight stop loss.'
  },
  {
    term: 'Market Structure Break (MSB)',
    category: 'Technical',
    definition: 'A structural pivot point where price violates the active trend sequence by breaking below a higher low (in an uptrend) or above a lower high (in a downtrend), signaling a trend shift.',
    example: 'In an uptrend, EUR/USD prints a lower low by breaking below the previous higher low, signaling that the trend is reversing bearish.',
    proTip: 'An MSB is the first warning sign of trend reversal. It is often followed by a retest of the broken structural level before the new trend takes off.'
  },

  // Fundamental Analysis
  {
    term: 'Interest Rate Decision',
    category: 'Fundamental',
    definition: 'The rate set by a country\'s central bank for lending money to commercial banks. It is the most powerful fundamental driver of currency value; higher interest rates yield higher currency demand due to higher yields.',
    example: 'The Fed raises interest rates by 25 basis points, triggering capital inflows into the US Dollar, causing it to strengthen.',
    proTip: 'Trading the immediate release of interest rate decisions is extremely high-risk due to slippage and unpredictable spikes.'
  },
  {
    term: 'Inflation (CPI)',
    category: 'Fundamental',
    definition: 'The rate at which prices for goods and services rise, measured primarily by the Consumer Price Index (CPI). Central banks monitor CPI closely to determine interest rate policy.',
    example: 'If US CPI comes in higher than expected, it suggests inflation is sticky, leading market participants to forecast rate hikes and buy the USD.',
    proTip: 'High inflation leads to rate hikes (supportive of currency), unless the economy is in stagnation, which can lead to panic capital flight.'
  },
  {
    term: 'Non-Farm Payrolls (NFP)',
    category: 'Fundamental',
    definition: 'An extremely high-impact economic indicator released in the US on the first Friday of every month, showing the number of jobs created or lost in the non-agricultural sector during the prior month.',
    example: 'An NFP figure exceeding expectations by 50,000 jobs indicates economic strength and usually triggers immediate USD buying.',
    proTip: 'The NFP release creates some of the highest volatility and spreads of the entire month. Many traders prefer to be flat prior to the announcement.'
  },
  {
    term: 'Central Bank',
    category: 'Fundamental',
    definition: 'An national institution responsible for managing a country\'s currency supply, interest rates, and monetary policy (e.g., Federal Reserve in the US, ECB in Europe, BOE in the UK).',
    example: 'The European Central Bank decides to launch a quantitative easing (bond buying) program to inject liquidity into the Eurozone.',
    proTip: 'Pay attention to central bank speeches (specifically Hawkish vs. Dovish rhetoric) as they lay the structural groundwork for future moves.'
  },
  {
    term: 'Hawkish vs. Dovish',
    category: 'Fundamental',
    definition: 'Adjectives describing a central bank\'s policy bias. Hawkish indicates a focus on raising interest rates to curb inflation, while Dovish indicates a bias toward lowering interest rates to stimulate growth and employment.',
    example: 'A hawkish speech by the Fed chairman hints at upcoming interest rate hikes, immediately strengthening the US Dollar.',
    proTip: 'Learn to track changes in central bank language. A sudden shift from dovish to hawkish can trigger long-term structural trend reversals.'
  },
  {
    term: 'FOMC (Federal Open Market Committee)',
    category: 'Fundamental',
    definition: 'The monetary policy-making branch of the US Federal Reserve System, consisting of 12 members who meet eight times a year to set the target federal funds rate.',
    example: 'Markets trade in tight ranges ahead of the afternoon FOMC statement and interest rate announcement.',
    proTip: 'The release of the FOMC Meeting Minutes three weeks after the main rate decision often triggers secondary volatility as traders scan the transcripts.'
  },
  {
    term: 'Quantitative Easing (QE)',
    category: 'Fundamental',
    definition: 'An unconventional monetary policy where a central bank purchases large quantities of government bonds or financial assets to pump liquidity directly into the financial system, lowering bond yields and stimulating lending.',
    example: 'To combat recessionary pressures, the ECB announces a major QE stimulus package, driving down the value of the Euro.',
    proTip: 'QE effectively increases currency supply and lowers borrowing costs, making it fundamentally bearish for that specific currency.'
  },
  {
    term: 'Risk-On & Risk-Off',
    category: 'Fundamental',
    definition: 'Market sentiment paradigms. Risk-On describes an optimistic environment where investors chase yield in riskier assets (AUD, NZD, GBP, stocks). Risk-Off describes a pessimistic environment where capital flees to safe-haven assets (USD, JPY, CHF, Gold).',
    example: 'Geopolitical tensions escalate, triggering a sudden Risk-Off environment where traders sell the AUD and buy the JPY.',
    proTip: 'Determine market sentiment before opening your charts. If indices are bleeding heavily, avoid buying risk-correlated currencies.'
  },
  {
    term: 'Safe Haven Currency',
    category: 'Fundamental',
    definition: 'A global currency that is historically expected to retain or even appreciate in value during periods of high geopolitical tension, financial crises, or extreme market uncertainty.',
    example: 'The US Dollar (USD), Japanese Yen (JPY), and Swiss Franc (CHF) are widely regarded as global safe-haven currencies.',
    proTip: 'During high global market panic, JPY and CHF will often strengthen even if their domestic interest rates are rock-bottom or negative.'
  },
  {
    term: 'Gross Domestic Product (GDP)',
    category: 'Fundamental',
    definition: 'The primary metric used to measure a nation\'s economic health, representing the total monetary value of all finished goods and services produced within its borders over a specific timeframe.',
    example: 'US GDP grows at an annualized rate of 3.2%, signaling strong economic health and boosting the USD.',
    proTip: 'While GDP is a lagging indicator, revisions to past GDP data can catch markets off guard and trigger massive moves.'
  },
  {
    term: 'Purchasing Managers\' Index (PMI)',
    category: 'Fundamental',
    definition: 'An economic indicator derived from monthly surveys of private sector purchasing managers, representing the expansion (>50) or contraction (<50) of business activity in manufacturing and service sectors.',
    example: 'German Manufacturing PMI drops to 45.2, indicating economic contraction in the Eurozone and putting pressure on the Euro.',
    proTip: 'PMI is considered a leading indicator because purchasing managers have early, direct insight into corporate buying trends and demand.'
  },
  {
    term: 'Retail Sales',
    category: 'Fundamental',
    definition: 'A key monthly economic indicator measuring the total consumer spending on finished goods at retail establishments, serving as a direct measure of consumer confidence and domestic demand.',
    example: 'US Retail Sales exceed forecasts, rising by 0.8% and suggesting robust economic activity, driving up the USD.',
    proTip: 'Consumer spending drives nearly 70% of the US economy, making the Retail Sales report a highly volatile fundamental event.'
  },
  {
    term: 'Unemployment Rate',
    category: 'Fundamental',
    definition: 'The percentage of the total active labor force that is currently unemployed and actively seeking work, acting as a crucial lagging indicator of economic strength.',
    example: 'UK unemployment drops to 3.8%, putting upward pressure on wages and raising expectations for BOE rate hikes.',
    proTip: 'A low unemployment rate indicates economic health but can also trigger inflation concerns due to rising wage costs.'
  },
  {
    term: 'Trade Balance',
    category: 'Fundamental',
    definition: 'The net difference between the monetary value of a country\'s exports and imports of goods and services over a given period. A positive figure is a Trade Surplus; a negative is a Trade Deficit.',
    example: 'A rising trade surplus in Australia due to heavy raw materials exports leads to increased global purchasing of the Australian Dollar (AUD).',
    proTip: 'Countries with persistent trade surpluses generally have stronger currencies because international buyers must purchase the local currency to pay for exports.'
  },
  {
    term: 'Quantitative Tightening (QT)',
    category: 'Fundamental',
    definition: 'A contractionary monetary policy implemented by central banks to reduce the money supply and liquidity in the financial system by letting bonds mature off their balance sheet or selling them directly.',
    example: 'The Federal Reserve launches a QT program, allowing $95 billion in bonds to roll off monthly, increasing market interest rates and supporting the USD.',
    proTip: 'QT is the exact opposite of Quantitative Easing (QE) and acts as a long-term bullish tailwind for the domestic currency.'
  },
  {
    term: 'Carry Trade',
    category: 'Fundamental',
    definition: 'A financial trading strategy where an investor borrows money in a currency with a low interest rate (the funding currency) and uses it to purchase a currency with a high interest rate (the target currency), pocketing the interest yield differential.',
    example: 'Borrowing JPY at 0.1% interest and buying AUD yielding 4.5% interest, profiting from the daily yield differential.',
    proTip: 'Carry trades perform exceptionally well during stable, low-volatility, Risk-On environments, but unwind violently when market fear triggers sudden safe-haven rallies.'
  },
  {
    term: 'G10 Currencies',
    category: 'Fundamental',
    definition: 'The group of the ten most heavily traded and liquid global currencies in the world.',
    example: 'The G10 group includes USD, EUR, GBP, JPY, CHF, CAD, AUD, NZD, SEK, and NOK.',
    proTip: 'G10 currencies feature the tightest spreads and are highly respected by standard technical analysis structures compared to exotic pairs.'
  },
  {
    term: 'Black Swan Event',
    category: 'Fundamental',
    definition: 'An extremely rare, highly unpredictable, catastrophic economic or geopolitical event that falls outside standard statistical expectations and triggers extreme financial market disruption.',
    example: 'The Swiss National Bank removing the EUR/CHF exchange rate floor in 2015, causing Swiss Franc pairs to drop thousands of pips instantly.',
    proTip: 'Because Black Swan events cannot be anticipated, professional traders use strict capital exposure limits and hard stop losses to guarantee survival.'
  },

  // Risk Management
  {
    term: 'Stop Loss (SL)',
    category: 'Risk',
    definition: 'A pending exit order designed to close out a losing trade at a pre-specified price level. It is the single most important rule in professional risk management to limit drawdown.',
    example: 'You buy EUR/USD at 1.0800 and set a Stop Loss at 1.0780, guaranteeing you lose no more than 20 pips if the trade goes against you.',
    proTip: 'Never move your stop loss further away during a trade. Accept the loss, learn from the trade, and move on.'
  },
  {
    term: 'Take Profit (TP)',
    category: 'Risk',
    definition: 'A pre-set exit order that automatically closes a winning trade once price reaches a specified profit target.',
    example: 'You buy GBP/USD at 1.2500 and place a Take Profit at 1.2600. The position closes immediately when price touches the level, locking in $1,000 profit.',
    proTip: 'Use dynamic targets based on key support/resistance levels rather than random arbitrary round numbers.'
  },
  {
    term: 'Risk-to-Reward Ratio (R:R)',
    category: 'Risk',
    definition: 'The relationship between your potential loss and your potential profit on any single trade.',
    example: 'A trade with a 20-pip stop loss and a 60-pip take profit has a 1:3 Risk-to-Reward ratio.',
    proTip: 'Maintaining a 1:2 R:R ratio means you only need to win 34% of your trades to remain profitable over the long term.'
  },
  {
    term: 'Drawdown',
    category: 'Risk',
    definition: 'The difference between the peak balance of your trading account and the subsequent lowest point, usually expressed as a percentage of your peak equity.',
    example: 'If your account balance grows to $10,000, then suffers a series of losses that drops it to $9,000, your maximum drawdown was 10%.',
    proTip: 'Professional traders focus first on capping their drawdown rather than maximizing their peak profits.'
  },
  {
    term: 'Breakeven (BE)',
    category: 'Risk',
    definition: 'Moving your Stop Loss order to your exact entry price once a trade has progressed cleanly into profit, completely eliminating any monetary risk in the trade.',
    example: 'You buy EUR/USD at 1.0800. Price moves up to 1.0840, so you move your Stop Loss from 1.0780 to 1.0800. If price reverses, you exit with $0 loss.',
    proTip: 'Moving to breakeven too early can choke your trade, stopping you out prematurely before the market has room to play out in your direction.'
  },
  {
    term: 'Trailing Stop',
    category: 'Risk',
    definition: 'A dynamic Stop Loss order that automatically tracks price as it moves in your favor, keeping a fixed distance. If price reverses, the stop loss locks in accumulated profits.',
    example: 'You short GBP/USD at 1.2500 with a 50-pip trailing stop. Price drops to 1.2400. Your trailing stop automatically moves down to 1.2450.',
    proTip: 'Trailing stops are highly effective during strong breakout trends but can lead to sub-optimal exits in choppy, ranging market structures.'
  },
  {
    term: 'Risk of Ruin',
    category: 'Risk',
    definition: 'A statistical probability calculation that estimates the likelihood of losing your entire trading capital (or hitting a point of no return) based on your win rate, R:R ratio, and risk percentage per trade.',
    example: 'Risking 10% per trade gives you a highly elevated Risk of Ruin of nearly 99% over 100 trades, even with a solid system.',
    proTip: 'Keep your risk per trade under 2% to drop your mathematical risk of ruin to virtually zero, ensuring survival through inevitable drawdown streaks.'
  },
  {
    term: 'Equity Curve',
    category: 'Risk',
    definition: 'A visual line chart plotting your trading account\'s net equity (balance + open trade value) over chronological time, showing the consistency of your trading strategy.',
    example: 'A smooth, upward-sloping equity curve with shallow drawdowns indicates highly consistent risk management and execution.',
    proTip: 'Focus on smoothing your equity curve. If your curve has steep, vertical spikes followed by massive drops, your position sizing is too aggressive.'
  },
  {
    term: 'Currency Correlation',
    category: 'Risk',
    definition: 'The statistical measure of how two currency pairs move in relation to one another. Positive correlation means they move in the same direction; negative correlation means they move in opposite directions.',
    example: 'EUR/USD and GBP/USD have a strong positive correlation, while EUR/USD and USD/CHF have a very strong negative correlation.',
    proTip: 'Avoid entering long positions on EUR/USD and GBP/USD simultaneously, as this effectively doubles your exposure to the same underlying market theme.'
  },
  {
    term: 'Margin Call',
    category: 'Risk',
    definition: 'A notification issued by a broker warning a trader that their account equity has fallen below the required margin threshold, meaning they must deposit more funds or close losing positions to maintain the open trades.',
    example: 'Your account balance is depleted by high drawdown, triggering a margin call when your margin level drops below 100%.',
    proTip: 'Never treat margin calls as an active trading tool. If you get a margin call, your risk management has already broken down.'
  },
  {
    term: 'Stop Out Level',
    category: 'Risk',
    definition: 'A critical margin level percentage set by a broker where your open positions are automatically liquidated (closed out) starting from the most unprofitable, preventing your account balance from falling into a negative balance.',
    example: 'A broker\'s stop out level is 50%. When your Margin Level hits 50%, your largest losing trade is instantly closed by the system.',
    proTip: 'Always size your trades using a position sizer to ensure your margin level remains high, avoiding automatic stop-outs.'
  },
  {
    term: 'Profit & Loss (P&L)',
    category: 'Risk',
    definition: 'The net financial result of a trade, representing the total monetary gain or loss once fees, swaps, and spreads are factored in.',
    example: 'Your EUR/USD trade closes at your take profit, resulting in a net P&L of +$450.00 USD.',
    proTip: 'Focus on your long-term cumulative P&L rather than obsessing over the outcome of a single transaction.'
  },
  {
    term: 'Risk per Trade',
    category: 'Risk',
    definition: 'The specific monetary amount or percentage of total account equity that a trader stands to lose if a single transaction hits their stop loss.',
    example: 'With a $10,000 account balance, you choose a 1% risk per trade, meaning you will lose exactly $100 if the trade fails.',
    proTip: 'Keeping your risk per trade uniform (e.g., exactly 1%) makes it much easier to recover from losing streaks mathematically.'
  },
  {
    term: 'Win Rate (Win-Loss Ratio)',
    category: 'Risk',
    definition: 'The percentage of successful trades relative to the total number of trades executed over a given sample size.',
    example: 'If you win 60 out of 100 trades, your trading system has a win rate of 60%.',
    proTip: 'A high win rate is not necessary to be profitable. A system with a 40% win rate can be highly profitable if its R:R is 1:3.'
  },
  {
    term: 'Profit Factor',
    category: 'Risk',
    definition: 'A key trading performance metric calculated by dividing your gross profits by your gross losses. A profit factor above 1.0 indicates a profitable system.',
    example: 'Your account makes $5,000 in gross profits and suffers $2,500 in gross losses, resulting in a healthy Profit Factor of 2.0.',
    proTip: 'Professional traders aim for a profit factor between 1.5 and 2.5, indicating consistent, low-variance profitability.'
  },
  {
    term: 'Expected Value (Expectancy)',
    category: 'Risk',
    definition: 'A statistical calculation showing the average dollar amount a trader expects to make (or lose) per trade over a large sample size, combining win rate, loss rate, average win, and average loss.',
    example: 'A system has a positive expectancy of +$25 per trade, meaning that over 500 trades, the user should mathematically net $12,500.',
    proTip: 'Only execute a system with a proven positive expectancy. Positive expectancy is the foundation of all professional trading edges.'
  },
  {
    term: 'Drawdown Duration',
    category: 'Risk',
    definition: 'The length of time (in days, weeks, or months) that a trading account remains below its previous peak equity high before recovering to set a new equity high.',
    example: 'An account hit a peak balance of $12,000, drops to $11,000, and takes 4 weeks of consistent trading to reach $12,050. The drawdown duration was 4 weeks.',
    proTip: 'Drawdown duration tests a trader\'s psychological stamina more than the actual depth of the drawdown itself.'
  },
  {
    term: 'R-Multiple (Risk Unit)',
    category: 'Risk',
    definition: 'A unit of measurement representing the initial risk taken on a trade (e.g., if you risk $100, 1R = $100). Profits are expressed as multiples of this risk (e.g., a $300 profit is a 3R trade).',
    example: 'You enter a trade with a $150 stop loss. The trade runs to profit and closes for a $450 gain. You made a 3R trade.',
    proTip: 'Expressing your journal in R-multiples removes the emotional distraction of raw dollar figures and highlights system efficiency.'
  },
  {
    term: 'Position Sizing',
    category: 'Risk',
    definition: 'The process of calculating the exact volume of units or lots to trade based on your account balance, risk percentage, and the distance to your stop loss in pips.',
    example: 'A trader uses their sizer to calculate that a 20-pip stop loss on EUR/USD with a $100 risk limit requires exactly 0.5 standard lots.',
    proTip: 'Never guestimate your position size. A single oversized trade can trigger a drawdown that takes months to recover from.'
  },

  // Order Types
  {
    term: 'Market Order',
    category: 'Orders',
    definition: 'An instruction to immediately buy or sell a currency pair at the best available current market price.',
    example: 'Clicking "Buy EURUSD" instantly enters you into a long position at the prevailing ask price of 1.0825.',
    proTip: 'Market orders are prone to "slippage" during news events, meaning your actual entry price may be slightly worse than the one displayed on screen.'
  },
  {
    term: 'Limit Order',
    category: 'Orders',
    definition: 'An order to execute a trade at a specific price or better. A Buy Limit is placed below the current market price, while a Sell Limit is placed above the current price.',
    example: 'EUR/USD is trading at 1.0850. You place a Buy Limit at 1.0800, expecting price to dip, trigger your entry, and bounce.',
    proTip: 'Limit orders guarantee your entry price (or better) but do not guarantee that your order will actually get triggered.'
  },
  {
    term: 'Stop Order',
    category: 'Orders',
    definition: 'An order to buy or sell once price breaks past a specific level. A Buy Stop is placed above the current market price, while a Sell Stop is placed below the current price.',
    example: 'GBP/USD is ranging below 1.3000. You place a Buy Stop at 1.3010 to enter a long position immediately when a bullish breakout occurs.',
    proTip: 'Stop orders are great for catching breakout momentum, but are susceptible to false breakouts where price triggers the order and immediately reverses.'
  },
  {
    term: 'Buy Limit Order',
    category: 'Orders',
    definition: 'A pending order type instructed to buy a currency pair only when price reaches a specified level *below* the current market price.',
    example: 'EUR/USD is at 1.0900. You place a Buy Limit at 1.0820, buying only if the market drops to that key support zone.',
    proTip: 'Use Buy Limits when you expect a corrective pullback to support before price resumes an uptrend.'
  },
  {
    term: 'Buy Stop Order',
    category: 'Orders',
    definition: 'A pending order type instructed to buy a currency pair only when price reaches a specified level *above* the current market price.',
    example: 'USD/JPY is trading at 150.00. You place a Buy Stop at 150.20 to capture the momentum immediately if price breaks daily resistance.',
    proTip: 'Buy Stop orders are highly effective for breakout trading, ensuring you are only entered once price confirms upward velocity.'
  },
  {
    term: 'Sell Limit Order',
    category: 'Orders',
    definition: 'A pending order type instructed to sell a currency pair only when price reaches a specified level *above* the current market price.',
    example: 'GBP/USD is trading at 1.2500. You place a Sell Limit at 1.2580, selling only if price rallies up to that key resistance level.',
    proTip: 'Sell Limits allow you to enter short positions at premium prices at the peak of a corrective rally.'
  },
  {
    term: 'Sell Stop Order',
    category: 'Orders',
    definition: 'A pending order type instructed to sell a currency pair only when price reaches a specified level *below* the current market price.',
    example: 'EUR/USD is trading at 1.0800. You place a Sell Stop at 1.0770 to short immediately if price breaks below the daily support floor.',
    proTip: 'Use Sell Stop orders to ride structural breakdowns of key consolidations or support corridors.'
  },
  {
    term: 'OCO (One-Cancels-the-Other)',
    category: 'Orders',
    definition: 'A trading setup combining two pending orders (typically a limit and a stop, or two stops). Triggering one order automatically cancels the secondary pending order.',
    example: 'Ahead of high-impact news, you place a Buy Stop at 1.0900 and a Sell Stop at 1.0800. Triggering the Buy Stop instantly deletes the Sell Stop.',
    proTip: 'OCO orders are excellent for trading economic releases or sharp technical ranges when you are certain volatility is coming but unsure of the breakout direction.'
  },
  {
    term: 'GTC (Good \'Til Cancelled)',
    category: 'Orders',
    definition: 'A standard duration instruction applied to a pending order, stating that the order should remain active in the broker\'s book until it is either triggered or manually deleted by the trader.',
    example: 'You place a GTC Buy Limit on EUR/JPY at 155.00, which remains active for three weeks until price finally dips and fills it.',
    proTip: 'Always audit your active GTC orders weekly. An old GTC order forgotten in your system can get triggered weeks later under completely different market conditions.'
  },
  {
    term: 'Day Order',
    category: 'Orders',
    definition: 'An instruction applied to a pending order stating that the order should automatically expire and be deleted if it is not filled by the end of the current trading day.',
    example: 'You place a Buy Limit at 9:00 AM. It fails to trigger, and at 5:00 PM EST, your broker automatically removes the pending order.',
    proTip: 'Day orders are ideal for day traders who do not want to be filled overnight while they are asleep and unable to monitor the market.'
  },
  {
    term: 'Trailing Stop Order',
    category: 'Orders',
    definition: 'A dynamic stop loss order set at a fixed distance (in pips or percentage) below or above the current market price. As the trade moves into profit, the stop loss moves with it. If price reverses, the stop loss remains stationary and gets triggered.',
    example: 'You buy EUR/USD at 1.0800 and set a 30-pip trailing stop. Price rises to 1.0850; your stop loss automatically trails up to 1.0820.',
    proTip: 'Trailing stops are exceptional tools to let your winning trades run during major, strong trend movements.'
  },
  {
    term: 'Stop-Limit Order',
    category: 'Orders',
    definition: 'A highly precise pending order combining a stop trigger and a limit execution. Once the "stop" price is hit, it triggers a "limit" order rather than a market order, preventing entry slippage.',
    example: 'You place a Stop-Limit order to buy at 1.0900 with a limit cap at 1.0905. Once price hits 1.0900, a limit order is placed, ensuring you aren\'t filled higher than 1.0905.',
    proTip: 'Use Stop-Limit orders during news releases to prevent getting filled at terrible prices due to liquidity gaps.'
  }
];

export default function Wiki() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  // Daily Term Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Filtered terms based on category and search query
  const filteredTerms = useMemo(() => {
    return FOREX_TERMS.filter((term) => {
      const matchesSearch = 
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = activeCategory === 'All' || term.category.toLowerCase() === activeCategory.toLowerCase();
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  // Quiz Options Generation
  const quizQuestions = useMemo(() => {
    const questions = [
      {
        question: "What is the primary term for the difference between the bid and ask price of a currency pair?",
        correctOption: "Spread",
        options: ["Pip", "Spread", "Margin", "Leverage"]
      },
      {
        question: "For JPY pairs, what price unit movement does 1 Pip represent?",
        correctOption: "0.01",
        options: ["0.0001", "0.01", "0.001", "0.1"]
      },
      {
        question: "Which indicator is traditionally used to identify overbought and oversold conditions?",
        correctOption: "RSI",
        options: ["MACD", "Moving Average", "RSI", "Support"]
      }
    ];
    return questions;
  }, []);

  const currentQuiz = quizQuestions[quizIndex];

  const handleQuizAnswer = (option: string) => {
    if (quizSubmitted) return;
    setSelectedQuizOption(option);
  };

  const submitQuiz = () => {
    if (!selectedQuizOption || quizSubmitted) return;
    setQuizSubmitted(true);
    if (selectedQuizOption === currentQuiz.correctOption) {
      setQuizScore(prev => prev + 1);
    }
  };

  const nextQuizQuestion = () => {
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
    setQuizIndex((prev) => (prev + 1) % quizQuestions.length);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="mb-8 relative overflow-hidden bg-gradient-to-r from-brand to-brand-dark p-8 md:p-10 rounded-3xl text-white shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2 bg-white/10 w-fit px-3 py-1 rounded-full text-xs font-semibold mb-3 tracking-wide">
            <Book size={14} className="text-brand-light animate-pulse" />
            <span>Forex Knowledge Base</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Forex Wiki</h1>
          <p className="text-brand-light/80 mt-2 max-w-xl text-sm md:text-base leading-relaxed">
            Your pocket encyclopedia for trading terminology. Browse professional definitions, clear real-world examples, and proven pro-tips.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Wiki Directory */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search & Category Layout */}
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search terms, concepts, or rules..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all text-slate-800 placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Scrollable Category Tabs */}
            <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
              {['All', 'Basics', 'Technical', 'Fundamental', 'Risk', 'Orders'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-brand text-white shadow-sm shadow-brand/20'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat === 'Risk' ? 'Risk Management' : cat === 'Orders' ? 'Order Types' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Count */}
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            <span>Directory Results</span>
            <span>{filteredTerms.length} Terms Found</span>
          </div>

          {/* Terms List */}
          <div className="space-y-4">
            {filteredTerms.length > 0 ? (
              filteredTerms.map((item) => {
                const isExpanded = expandedTerm === item.term;
                return (
                  <div
                    key={item.term}
                    className={`bg-white rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 overflow-hidden hover:shadow-md ${
                      isExpanded ? 'ring-2 ring-brand/20 border-brand/20' : ''
                    }`}
                  >
                    {/* Header trigger */}
                    <button
                      onClick={() => setExpandedTerm(isExpanded ? null : item.term)}
                      className="w-full p-5 md:p-6 text-left flex justify-between items-center gap-4 cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                              item.category === 'Basics'
                                ? 'bg-blue-50 text-blue-600'
                                : item.category === 'Technical'
                                ? 'bg-indigo-50 text-indigo-600'
                                : item.category === 'Fundamental'
                                ? 'bg-amber-50 text-amber-600'
                                : item.category === 'Risk'
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            {item.category === 'Risk' ? 'Risk Mgmt' : item.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight mt-1">{item.term}</h3>
                      </div>
                      <ChevronRight
                        size={20}
                        className={`text-slate-400 transition-transform duration-300 ${
                          isExpanded ? 'rotate-90 text-brand' : ''
                        }`}
                      />
                    </button>

                    {/* Expandable Details */}
                    {isExpanded && (
                      <div className="px-5 pb-6 md:px-6 md:pb-8 border-t border-slate-50 pt-5 space-y-5 animate-in slide-in-from-top-3 duration-200">
                        {/* Definition */}
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Compass size={14} className="text-brand" /> Definition
                          </h4>
                          <p className="text-slate-700 leading-relaxed font-medium">{item.definition}</p>
                        </div>

                        {/* Practical Example */}
                        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 space-y-1">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers size={14} className="text-slate-600" /> Real-World Example
                          </h4>
                          <p className="text-slate-600 text-sm leading-relaxed font-medium italic">"{item.example}"</p>
                        </div>

                        {/* Pro Tip */}
                        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-start space-x-3 text-emerald-800">
                          <Lightbulb className="shrink-0 text-emerald-600 mt-0.5" size={18} />
                          <div className="space-y-0.5">
                            <h5 className="font-bold text-xs uppercase tracking-wider">Pro Trader Tip</h5>
                            <p className="text-sm leading-relaxed font-medium text-emerald-700">{item.proTip}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                  <HelpCircle size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">No definitions found</h3>
                  <p className="text-slate-500 text-sm mt-1">Try refining your search terms or selecting a different category.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widget Block */}
        <div className="space-y-6">
          {/* Quick Quiz Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-8 -mt-8 blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Award className="text-indigo-400" size={20} />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Trader IQ Quiz</span>
              </div>
              {quizScore > 0 && (
                <span className="bg-indigo-500/30 text-indigo-200 text-xs px-2 py-0.5 rounded-full font-bold">
                  Score: {quizScore}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold leading-snug">{currentQuiz.question}</h3>
              
              <div className="space-y-2">
                {currentQuiz.options.map((option) => {
                  const isSelected = selectedQuizOption === option;
                  const isCorrect = option === currentQuiz.correctOption;
                  
                  let btnStyle = "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10";
                  if (quizSubmitted) {
                    if (isCorrect) {
                      btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-300";
                    } else if (isSelected) {
                      btnStyle = "bg-rose-500/20 border-rose-500 text-rose-300";
                    } else {
                      btnStyle = "bg-white/5 border-transparent text-slate-500 opacity-60";
                    }
                  } else if (isSelected) {
                    btnStyle = "bg-indigo-500/30 border-indigo-400 text-white";
                  }

                  return (
                    <button
                      key={option}
                      onClick={() => handleQuizAnswer(option)}
                      disabled={quizSubmitted}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${btnStyle}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {!quizSubmitted ? (
                <button
                  onClick={submitQuiz}
                  disabled={!selectedQuizOption}
                  className="w-full bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm mt-2 shadow-md shadow-brand/10 active:scale-95"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={nextQuizQuestion}
                  className="w-full bg-white/15 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm mt-2 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span>Next Question</span>
                  <ChevronRight size={16} />
                </button>
              )}

              {quizSubmitted && (
                <div className="text-center pt-2 text-xs font-semibold text-slate-400">
                  {selectedQuizOption === currentQuiz.correctOption ? (
                    <span className="text-emerald-400 font-bold">✓ Correct! Excellent job.</span>
                  ) : (
                    <span className="text-rose-400 font-bold">✗ Incorrect. Correct answer was {currentQuiz.correctOption}.</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Study Tip */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="text-brand shrink-0" size={18} /> How to Study Terms
            </h3>
            <ul className="text-sm text-slate-600 space-y-3 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-brand font-bold">•</span>
                <span>Don't memorize definitions literally; focus on their application in a live chart.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand font-bold">•</span>
                <span>Learn one high-impact fundamental announcement (like NFP) at a time to prevent confusion.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand font-bold">•</span>
                <span>Apply risk limits (SL/TP) on every demo transaction before trading real capital.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
