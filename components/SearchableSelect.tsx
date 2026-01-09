
import React, { useState, useEffect, useRef } from 'react';

interface SearchableSelectProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ label, options, value, onChange, placeholder, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div className="space-y-1 relative" ref={wrapperRef}>
      <label className="text-sm font-black text-slate-700 md:text-slate-400 uppercase tracking-widest ml-1">
        {label} {required && '*'}
      </label>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl cursor-pointer flex justify-between items-center hover:border-primary/30 transition-all"
      >
        <span className={`font-bold ${value ? 'text-slate-800' : 'text-slate-400 italic'}`}>
          {value || placeholder || 'Selecione...'}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-[100] top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-slate-100 sticky top-0 bg-white">
            <input 
              type="text"
              autoFocus
              className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm"
              placeholder="Digite para buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto no-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, i) => (
                <div 
                  key={i}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`px-6 py-4 hover:bg-primary hover:text-white cursor-pointer font-bold text-sm transition-colors ${value === opt ? 'bg-primary/10 text-primary' : 'text-slate-600'}`}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-slate-400 italic text-xs">Nenhum resultado.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
