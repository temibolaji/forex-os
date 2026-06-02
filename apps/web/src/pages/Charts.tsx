import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';


export default function Charts() {
  return (
    <div className="h-full flex flex-col">
      <header className="px-6 py-6 border-b border-white/5 shrink-0 hidden md:block relative z-10">
        <h1 className="text-3xl font-display font-bold text-slate-100 flex items-center space-x-3">
          <span>Advanced Charts</span>
        </h1>
        <p className="text-slate-400 mt-1">Analyze markets in real-time with TradingView.</p>
      </header>

      <div className="flex-1 w-full bg-slate-900 p-2 md:p-6 pb-24 md:pb-6 relative z-10">
        <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950">
          <AdvancedRealTimeChart
            theme="dark"
            symbol="FX:EURUSD"
            interval="60"
            timezone="Etc/UTC"
            style="1"
            locale="en"
            enable_publishing={false}
            hide_side_toolbar={false}
            allow_symbol_change={true}
            container_id="tradingview_chart"
            autosize
          />
        </div>
      </div>
    </div>
  );
}
