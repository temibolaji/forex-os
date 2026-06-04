import { useState, useMemo } from 'react';
import { Camera, BookOpen, ExternalLink } from 'lucide-react';
import { useTradeStore } from '../store/tradeStore';

export default function Playbook() {
  const trades = useTradeStore(state => state.trades);
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  // Filter only winning trades that have a screenshot
  const playbookTrades = useMemo(() => {
    return trades.filter(t => t.status === 'CLOSED' && t.pnlUsd && t.pnlUsd > 0 && t.screenshotUrl)
      .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }, [trades]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    playbookTrades.forEach(t => {
      if (t.setupTags) t.setupTags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [playbookTrades]);

  const filteredTrades = useMemo(() => {
    if (selectedTag === 'ALL') return playbookTrades;
    return playbookTrades.filter(t => t.setupTags?.includes(selectedTag));
  }, [playbookTrades, selectedTag]);

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-white tracking-tight flex items-center gap-3">
            <Camera className="text-indigo-400" size={28} />
            The Playbook
          </h1>
          <p className="text-slate-400 mt-2 font-medium">A visual gallery of your A+ setups and winning trades.</p>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag('ALL')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border ${selectedTag === 'ALL' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
          >
            All Setups
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border ${selectedTag === tag ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {playbookTrades.length === 0 ? (
        <div className="glass-panel border-dashed border-white/10 p-12 flex flex-col items-center justify-center text-center rounded-3xl">
          <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen size={32} className="text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Your Playbook is Empty</h3>
          <p className="text-slate-400 max-w-md">
            To build your playbook, add a TradingView Screenshot URL to any winning trade in your Journal.
          </p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredTrades.map(trade => (
            <div key={trade.id} className="break-inside-avoid glass-panel bg-slate-900/40 rounded-3xl border border-white/5 overflow-hidden shadow-lg group hover:border-indigo-500/30 transition-all duration-300">
              <div className="relative aspect-video bg-slate-800 border-b border-white/5 group-hover:brightness-110 transition-all">
                {trade.screenshotUrl ? (
                  <img src={trade.screenshotUrl} alt={`${trade.pair} setup`} className="w-full h-full object-cover" onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop';
                  }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Camera size={32} />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold border backdrop-blur-md ${trade.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                    {trade.direction}
                  </span>
                  <a href={trade.screenshotUrl} target="_blank" rel="noreferrer" className="w-7 h-7 bg-slate-900/80 backdrop-blur-md rounded-md border border-white/10 flex items-center justify-center text-white hover:bg-indigo-500 transition-colors">
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-display font-black text-xl text-white tracking-tight">{trade.pair}</h3>
                    <div className="text-xs text-slate-400 font-medium">{new Date(trade.openedAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-black text-lg text-emerald-400">+${trade.pnlUsd?.toFixed(2)}</div>
                    <div className="text-xs font-bold text-emerald-500/70">{trade.pipsResult} pips</div>
                  </div>
                </div>
                
                {trade.notes && (
                  <p className="text-sm text-slate-300/80 mt-4 leading-relaxed line-clamp-3">
                    "{trade.notes}"
                  </p>
                )}

                {trade.setupTags && trade.setupTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-5">
                    {trade.setupTags.map(tag => (
                      <span key={tag} className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-md uppercase tracking-widest">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
