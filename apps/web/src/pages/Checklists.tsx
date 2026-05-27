import { useState } from 'react';
import { CheckSquare, Plus, Save, Trash2, ShieldAlert } from 'lucide-react';

export default function Checklists() {
  const [templates, setTemplates] = useState([
    {
      id: '1',
      name: 'Trend Following Entry',
      rules: [
        { id: 'r1', text: 'Price is above 200 EMA', required: true },
        { id: 'r2', text: 'Stochastic is oversold (< 20)', required: true },
        { id: 'r3', text: 'Risk is 1% or less', required: true },
        { id: 'r4', text: 'No high impact news in next 2 hours', required: false },
      ]
    }
  ]);

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRules, setEditRules] = useState<{ id: string, text: string, required: boolean }[]>([]);

  const startNewTemplate = () => {
    setEditId(null);
    setEditName('New Strategy Template');
    setEditRules([{ id: Date.now().toString(), text: '', required: true }]);
    setIsEditing(true);
  };

  const editTemplate = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      setEditId(template.id);
      setEditName(template.name);
      setEditRules(template.rules.map(r => ({...r})));
      setIsEditing(true);
    }
  };

  const addRule = () => {
    setEditRules([...editRules, { id: Date.now().toString(), text: '', required: true }]);
  };

  const updateRule = (id: string, field: 'text' | 'required', value: any) => {
    setEditRules(editRules.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeRule = (id: string) => {
    setEditRules(editRules.filter(r => r.id !== id));
  };

  const saveTemplate = () => {
    const validRules = editRules.filter(r => r.text.trim() !== '');
    if (validRules.length > 0 && editName.trim() !== '') {
      if (editId) {
        setTemplates(templates.map(t => t.id === editId ? { id: editId, name: editName, rules: validRules } : t));
      } else {
        setTemplates([...templates, { id: Date.now().toString(), name: editName, rules: validRules }]);
      }
    }
    setIsEditing(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Trade Checklists</h1>
          <p className="text-slate-500 mt-1">Enforce discipline with pre-trade rules.</p>
        </div>
        {!isEditing && (
          <button
            onClick={startNewTemplate}
            className="flex items-center space-x-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-light transition-colors shadow-md"
          >
            <Plus size={18} />
            <span>New Template</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:p-8 animate-in slide-in-from-bottom-4 duration-300">
          <input
            type="text"
            className="text-2xl font-bold text-slate-900 w-full mb-6 outline-none border-b border-transparent hover:border-slate-200 focus:border-brand pb-2 bg-transparent transition-colors"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Template Name"
          />

          <div className="space-y-3 mb-6">
            {editRules.map((rule, idx) => (
              <div key={rule.id} className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                <span className="text-slate-400 font-bold w-6 text-center">{idx + 1}.</span>
                <input
                  type="text"
                  className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400"
                  placeholder="Enter rule text (e.g. Price is near Support)"
                  value={rule.text}
                  onChange={(e) => updateRule(rule.id, 'text', e.target.value)}
                />
                <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                  <input
                    type="checkbox"
                    className="rounded text-brand focus:ring-brand accent-brand"
                    checked={rule.required}
                    onChange={(e) => updateRule(rule.id, 'required', e.target.checked)}
                  />
                  <span className="text-xs font-semibold text-slate-600 uppercase">Required</span>
                </label>
                <button
                  onClick={() => removeRule(rule.id)}
                  className="text-slate-400 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <button
              onClick={addRule}
              className="flex items-center space-x-2 text-brand font-medium hover:text-brand-light px-3 py-2 rounded-lg hover:bg-brand/5 transition-colors"
            >
              <Plus size={18} />
              <span>Add Rule</span>
            </button>
            <div className="flex space-x-3 w-full sm:w-auto">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 sm:flex-none px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveTemplate}
                className="flex-1 sm:flex-none flex justify-center items-center space-x-2 px-6 py-2 bg-gradient-to-r from-brand to-brand-light text-white rounded-lg shadow-md hover:shadow-lg transition-all font-medium transform active:scale-95"
              >
                <Save size={18} />
                <span>Save Template</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center space-x-3">
                <div className="bg-brand/10 p-2 rounded-lg">
                  <CheckSquare size={20} className="text-brand" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{template.name}</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {template.rules.map(rule => (
                    <div key={rule.id} className="flex items-start space-x-3 text-sm">
                      {rule.required ? (
                        <ShieldAlert size={16} className="text-rose-400 shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-4 h-4 shrink-0 rounded border border-slate-300 mt-0.5"></div>
                      )}
                      <span className={`${rule.required ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                        {rule.text}
                      </span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => editTemplate(template.id)}
                  className="w-full mt-6 text-sm font-semibold text-brand bg-brand/5 hover:bg-brand hover:text-white py-2 rounded-lg transition-colors border border-brand/10 group-hover:border-transparent"
                >
                  Edit Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
