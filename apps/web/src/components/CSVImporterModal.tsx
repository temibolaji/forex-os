import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { UploadCloud, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTradeStore, type Trade } from '../store/tradeStore';

interface CSVImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CSVImporterModal({ isOpen, onClose }: CSVImporterModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedTrades, setParsedTrades] = useState<Omit<Trade, 'id'>[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentUser = useAuthStore(state => state.currentUser);
  const addTradesBulk = useTradeStore(state => state.addTradesBulk);

  if (!isOpen) return null;

  const processCSV = (file: File) => {
    setError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const trades: Omit<Trade, 'id'>[] = [];
          
          results.data.forEach((row: any) => {
            // Very basic MT4/MT5 / Generic CSV parsing heuristics
            const pair = row['Item'] || row['Symbol'] || row['Pair'];
            if (!pair) return; // Skip rows without pair
            
            const typeStr = (row['Type'] || row['Direction'] || '').toLowerCase();
            if (!typeStr.includes('buy') && !typeStr.includes('sell') && !typeStr.includes('long') && !typeStr.includes('short')) return;
            
            const direction = (typeStr.includes('buy') || typeStr.includes('long')) ? 'LONG' : 'SHORT';
            
            const entryPrice = parseFloat(row['Open Price'] || row['Price'] || row['Entry'] || '0');
            const closePrice = parseFloat(row['Close Price'] || row['Exit'] || '0');
            const slPrice = parseFloat(row['S / L'] || row['SL'] || '0');
            const tpPrice = parseFloat(row['T / P'] || row['TP'] || '0');
            const lotSize = parseFloat(row['Size'] || row['Lot'] || row['Volume'] || '0.1');
            const pnlUsd = parseFloat(row['Profit'] || row['PnL'] || '0');
            
            // Generate openedAt from Open Time or default to now
            let openedAt = new Date().toISOString();
            if (row['Open Time'] || row['Time']) {
              const d = new Date(row['Open Time'] || row['Time']);
              if (!isNaN(d.getTime())) openedAt = d.toISOString();
            }

            const status = (row['Close Time'] || closePrice > 0 || pnlUsd !== 0) ? 'CLOSED' : 'OPEN';

            trades.push({
              pair: pair.replace(/[^a-zA-Z]/g, '').substring(0, 6).toUpperCase(), // e.g. EURUSD
              direction,
              entryPrice,
              slPrice,
              tpPrice,
              lotSize,
              session: 'OTHER', // Default session
              pnlUsd: status === 'CLOSED' ? pnlUsd : null,
              pipsResult: status === 'CLOSED' ? 0 : null, // Would require complex pip calculation based on pair
              status,
              openedAt
            });
          });

          if (trades.length === 0) {
            setError("Could not find any valid trades in this CSV. Ensure it has columns like 'Item', 'Type', 'Open Price'.");
            return;
          }

          setParsedTrades(trades);
        } catch (err) {
          setError("Failed to parse CSV format. Please ensure it's a valid trade export.");
        }
      },
      error: (err) => {
        setError("Error reading file: " + err.message);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processCSV(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processCSV(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (currentUser && parsedTrades.length > 0) {
      addTradesBulk(currentUser.email, parsedTrades);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setParsedTrades([]);
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-white/5 bg-slate-900/50">
          <h2 className="text-lg font-display font-bold text-slate-100 flex items-center gap-2">
            <UploadCloud size={20} className="text-indigo-400" />
            Import Trades from CSV
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {isSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Import Successful!</h3>
              <p className="text-slate-400">Successfully imported {parsedTrades.length} trades.</p>
            </div>
          ) : parsedTrades.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3">
                <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-emerald-400 font-semibold text-sm">Found {parsedTrades.length} trades</h4>
                  <p className="text-emerald-500/70 text-xs mt-1">Review the preview below and click Import to save them to your journal.</p>
                </div>
              </div>
              
              <div className="bg-slate-950 border border-white/5 rounded-xl overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-900 sticky top-0 border-b border-white/5">
                      <tr>
                        <th className="px-4 py-3 font-medium">Pair</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Lot</th>
                        <th className="px-4 py-3 font-medium text-right">PnL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {parsedTrades.slice(0, 50).map((t, i) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="px-4 py-3 font-medium text-slate-200">{t.pair}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {t.direction}
                            </span>
                          </td>
                          <td className="px-4 py-3">{t.lotSize}</td>
                          <td className={`px-4 py-3 text-right font-medium ${(t.pnlUsd || 0) > 0 ? 'text-emerald-400' : (t.pnlUsd || 0) < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                            ${t.pnlUsd?.toFixed(2) || '0.00'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedTrades.length > 50 && (
                  <div className="p-3 text-center text-xs text-slate-500 bg-slate-900 border-t border-white/5">
                    Showing first 50 trades
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setParsedTrades([])}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleImport}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Import Trades
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                  ${isDragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5 shadow-sm">
                  <UploadCloud size={24} className={isDragging ? 'text-indigo-400' : 'text-slate-400'} />
                </div>
                <h3 className="text-slate-200 font-semibold mb-1">Upload MT4/MT5 CSV</h3>
                <p className="text-slate-500 text-sm mb-4">Drag and drop your file here, or click to browse</p>
                <button className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
                  Select File
                </button>
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-rose-400 text-sm leading-tight">{error}</p>
                </div>
              )}

              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Supported Formats</h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Export your trade history from Exness, MT4, or MT5 as a CSV. The parser looks for columns like <span className="text-slate-300">Item/Symbol</span>, <span className="text-slate-300">Type</span>, <span className="text-slate-300">Size</span>, and <span className="text-slate-300">Profit</span>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
