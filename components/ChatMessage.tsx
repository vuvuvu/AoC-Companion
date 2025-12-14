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
       <div className="my-4 flex flex-col gap-2">
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

  return (
    <div className="relative my-4">
      {isProcessing && !svg && (
         <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded border border-gray-700/50 h-24">
           <span className="text-xs text-gray-500 animate-pulse">Generating Diagram...</span>
         </div>
      )}
      <div 
        className={`bg-slate-900/50 p-4 rounded overflow-x-auto flex justify-center border border-gray-700/50 transition-opacity duration-300 ${isProcessing && !svg ? 'opacity-0' : 'opacity-100'}`}
        dangerouslySetInnerHTML={{ __html: svg }} 
      />
    </div>
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