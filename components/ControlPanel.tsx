import React from 'react';
import { AppState, HintLevel, LANGUAGES, YEARS, DAYS } from '../types';

interface ControlPanelProps {
  state: AppState;
  onStateChange: (newState: Partial<AppState>) => void;
  isChatActive: boolean;
  isLoadingContext?: boolean;
  onRefreshContext: () => void;
  onResetChat: () => void;
  onUpdateApiKey: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  state, 
  onStateChange, 
  isChatActive, 
  isLoadingContext = false,
  onRefreshContext,
  onResetChat,
  onUpdateApiKey
}) => {
  
  const handleLevelChange = (level: HintLevel) => {
    onStateChange({ hintLevel: level });
  };

  return (
    <div className="bg-slate-800/50 border-r border-gray-700/50 w-full md:w-80 flex-shrink-0 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <h2 className="text-aoc-yellow text-lg font-bold mb-6 flex items-center">
          <span className="mr-2">⚙️</span> CONFIG
        </h2>

        {/* Year Selection */}
        <div className="mb-6">
          <label className="block text-xs uppercase text-gray-500 mb-2 font-bold tracking-wider">AoC Year</label>
          <select 
            value={state.year}
            onChange={(e) => onStateChange({ year: e.target.value })}
            className="w-full bg-slate-900 border border-gray-600 text-aoc-gray rounded p-2 text-sm focus:border-aoc-green focus:outline-none transition-colors"
          >
            {YEARS.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Day Selection */}
        <div className="mb-6">
          <label className="block text-xs uppercase text-gray-500 mb-2 font-bold tracking-wider">Puzzle Day</label>
          <select 
            value={state.day}
            onChange={(e) => onStateChange({ day: e.target.value })}
            className="w-full bg-slate-900 border border-gray-600 text-aoc-gray rounded p-2 text-sm focus:border-aoc-green focus:outline-none transition-colors"
          >
            {DAYS.map(day => (
              <option key={day} value={day}>Day {day}</option>
            ))}
          </select>
        </div>

        {/* Language Selection */}
        <div className="mb-6">
          <label className="block text-xs uppercase text-gray-500 mb-2 font-bold tracking-wider">Tech Stack</label>
          <select 
            value={state.language}
            onChange={(e) => onStateChange({ language: e.target.value })}
            className="w-full bg-slate-900 border border-gray-600 text-aoc-gray rounded p-2 text-sm focus:border-aoc-green focus:outline-none transition-colors"
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        {/* Hint Level Slider/Buttons */}
        <div className="mb-8">
          <label className="block text-xs uppercase text-gray-500 mb-2 font-bold tracking-wider">Assistance Level</label>
          <div className="flex flex-col gap-2">
            {Object.values(HintLevel).map((level) => (
              <button
                key={level}
                onClick={() => handleLevelChange(level)}
                className={`text-left px-3 py-2 rounded text-xs font-bold transition-all duration-200 border ${
                  state.hintLevel === level
                    ? 'bg-aoc-green/20 border-aoc-green text-aoc-green shadow-[0_0_10px_rgba(0,204,0,0.2)]'
                    : 'bg-slate-900 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-gray-500 italic">
            {state.hintLevel === HintLevel.VAGUE && "Minimal guidance. Just a gentle push."}
            {state.hintLevel === HintLevel.LOGIC && "Conceptual explanations of algorithms."}
            {state.hintLevel === HintLevel.PSEUDOCODE && "Step-by-step logic, no real code."}
            {state.hintLevel === HintLevel.DEBUG && "Paste your code, I'll find bugs."}
          </p>
        </div>

        {/* Context Input */}
        <div className="flex flex-col min-h-[150px] relative">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs uppercase text-gray-500 font-bold tracking-wider">
              Puzzle Context
            </label>
            <button 
              onClick={onRefreshContext}
              disabled={isLoadingContext}
              className="text-[10px] flex items-center gap-1 bg-slate-900 border border-gray-600 px-2 py-1 rounded hover:border-aoc-green hover:text-aoc-green transition-colors disabled:opacity-50"
              title="Re-fetch from AoC"
            >
               {isLoadingContext ? (
                 <span className="animate-spin">↻</span>
               ) : (
                 <span>↻</span>
               )}
               {isLoadingContext ? 'FETCHING...' : 'REFRESH'}
            </button>
          </div>
          
          <div className="relative flex-1 w-full">
             <textarea
              value={state.puzzleContext}
              onChange={(e) => onStateChange({ puzzleContext: e.target.value })}
              placeholder="Paste the specific problem part or rules here..."
              className={`w-full h-32 bg-slate-900 border text-aoc-gray rounded p-2 text-xs font-mono resize-none transition-colors
                ${isLoadingContext ? 'border-aoc-green/50 opacity-50 cursor-wait' : 'border-gray-600 focus:border-aoc-yellow focus:outline-none'}
              `}
              disabled={isLoadingContext}
            />
          </div>
          <p className="text-[10px] text-gray-600 mt-1">
            *Autofilled from AoC via Search. Edit if needed.
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-700 bg-slate-900/80 flex flex-col gap-3">
        <button
          onClick={onResetChat}
          className="w-full flex items-center justify-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 hover:border-red-500 rounded p-2 text-xs font-bold transition-all uppercase tracking-wider"
        >
          <span>🗑️</span> New Chat
        </button>
        <button
          onClick={onUpdateApiKey}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-aoc-yellow border border-aoc-yellow/20 hover:border-aoc-yellow/50 rounded p-2 text-xs font-bold transition-all uppercase tracking-wider"
        >
          <span>🔑</span> Update API Key
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;