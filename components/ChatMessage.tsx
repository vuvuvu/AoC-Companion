import React, { useEffect, useState, useRef } from 'react';
import { Message, Sender } from '../types';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';

interface ChatMessageProps {
  message: Message;
}

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: '"Source Code Pro", monospace',
});

const MermaidChart = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    let isMounted = true;
    
    const renderChart = async () => {
      // heuristic fix: auto-quote unquoted labels with parens or commas
      // e.g. A[Text (1)] -> A["Text (1)"]
      const patchedChart = chart.replace(/\[([^"\]\n]*?[\(\),][^"\]\n]*?)\]/g, '["$1"]');

      try {
        setError(false);
        setIsProcessing(true);
        const { svg } = await mermaid.render(idRef.current, patchedChart);
        if (isMounted) {
          setSvg(svg);
          setIsProcessing(false);
        }
      } catch (e) {
        console.warn("Mermaid rendering failed (likely incomplete stream):", e);
        if (isMounted) {
          setError(true);
          setIsProcessing(false);
        }
      }
    };

    // Debounce rendering to avoid parsing incomplete stream chunks
    const timer = setTimeout(() => {
      renderChart();
    }, 600);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [chart]);

  if (error) {
    return (
       <div className="my-2 flex flex-col gap-2">
        <div className="bg-red-900/20 border border-red-500/30 p-2 rounded text-xs text-red-400 font-mono flex justify-between items-center">
          <span>Mermaid Render Failed (Displaying Source)</span>
          <button 
            onClick={() => setError(false)} 
            className="text-[10px] underline hover:text-white"
          >
            Retry
          </button>
        </div>
        <pre className="bg-black/50 p-3 rounded-md text-xs overflow-x-auto border border-gray-700">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  // Loading State
  if (isProcessing && !svg) {
    return (
       <div className="my-2 p-3 bg-slate-900/30 border border-gray-700/30 rounded flex items-center gap-3 animate-pulse">
         <div className="w-4 h-4 bg-gray-700 rounded-full"></div>
         <span className="text-xs text-gray-500 font-mono">Generating diagram...</span>
       </div>
    );
  }

  // Compact Button View
  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="my-3 group cursor-pointer select-none inline-block w-full md:w-auto"
      >
        <div className="bg-slate-900/80 border border-gray-700/50 hover:border-aoc-green/50 hover:bg-slate-800 p-3 rounded-md flex items-center gap-4 transition-all shadow-sm max-w-sm">
           <div className="w-10 h-10 rounded bg-slate-800 border border-gray-700 flex items-center justify-center text-xl shadow-inner flex-shrink-0">
             📊
           </div>
           <div className="flex flex-col flex-grow">
             <span className="text-xs font-bold text-aoc-blue group-hover:text-aoc-green transition-colors font-mono">
               Diagram Ready
             </span>
             <span className="text-[10px] text-gray-500">
               Click to view logic flow
             </span>
           </div>
           <div className="opacity-50 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-aoc-green">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
           </div>
        </div>
      </div>

      {/* Full Screen Modal */}
      {isModalOpen && (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200"
            onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-slate-900 border border-gray-600 rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col relative"
            onClick={e => e.stopPropagation()}
          >
             {/* Modal Header */}
             <div className="flex justify-between items-center p-3 border-b border-gray-700 bg-slate-900/90 rounded-t-lg">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Mermaid Visualization</span>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1 rounded"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
             </div>
             
             {/* Modal Content - Scrollable */}
             <div className="flex-1 overflow-auto p-6 bg-[#0d0d15] flex justify-center items-start custom-scrollbar">
                <div 
                  dangerouslySetInnerHTML={{ __html: svg }} 
                  className="min-w-min mx-auto"
                />
             </div>
          </div>
        </div>
      )}
    </>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === Sender.USER;
  const isSystem = message.sender === Sender.SYSTEM;

  if (isSystem) {
    return (
      <div className="flex justify-center my-4 opacity-75">
        <span className="text-xs text-aoc-gray border border-aoc-gray/30 px-3 py-1 rounded-full bg-aoc-dark/50">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] md:max-w-[85%] rounded-lg p-4 shadow-lg ${
          isUser
            ? 'bg-aoc-green/10 border border-aoc-green/30 text-aoc-gray'
            : 'bg-slate-800 border border-aoc-yellow/20 text-aoc-gray'
        }`}
      >
        <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${isUser ? 'text-aoc-green' : 'text-aoc-yellow'}`}>
            {isUser ? '> USER' : '> HELPER_BOT'}
          </span>
          <span className="text-[10px] text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="prose prose-invert prose-sm max-w-none font-mono text-sm leading-relaxed">
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                
                if (language === 'mermaid') {
                  return <MermaidChart chart={String(children).replace(/\n$/, '')} />;
                }

                const isInline = !match && !String(children).includes('\n');
                return isInline ? (
                  <code className="bg-slate-900 text-aoc-blue px-1 py-0.5 rounded text-xs" {...props}>
                    {children}
                  </code>
                ) : (
                  <code className="block bg-black/50 p-3 rounded-md text-xs overflow-x-auto border border-gray-700 my-2" {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {message.text}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;