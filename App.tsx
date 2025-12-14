import React, { useState, useEffect, useRef } from 'react';
import ControlPanel from './components/ControlPanel';
import ChatMessage from './components/ChatMessage';
import { AppState, HintLevel, Message, Sender } from './types';
import { initializeChat, sendMessageToGemini, updateSystemContext, fetchPuzzleFromAoC } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isContextLoading, setIsContextLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [appState, setAppState] = useState<AppState>({
    year: '2025',
    day: '9',
    language: 'Python',
    hintLevel: HintLevel.LOGIC,
    puzzleContext: ''
  });

  // Function to fetch context, extracted for reuse
  const fetchContext = async () => {
    setIsContextLoading(true);
    // We let the service handle the missing API key error so the UI shows something useful
    const text = await fetchPuzzleFromAoC(appState.year, appState.day);
    setAppState(prev => ({ ...prev, puzzleContext: text }));
    setIsContextLoading(false);
  };

  // Fetch puzzle context when day or year changes
  useEffect(() => {
    let isMounted = true;
    
    // Debounce to prevent flashing/rate-limiting if user scrolls fast
    const timer = setTimeout(() => {
      if (isMounted) {
        fetchContext();
      }
    }, 800);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState.year, appState.day]); // Intentionally not including fetchContext in dependency to avoid loops

  // Debounce context updates to the AI
  useEffect(() => {
    if (isInitialized) {
      const timeoutId = setTimeout(() => {
        updateSystemContext(appState);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [appState.hintLevel, appState.language, appState.year, appState.day, appState.puzzleContext, isInitialized]); 

  // Initial Chat Setup
  useEffect(() => {
    const init = async () => {
      const success = await initializeChat(appState);
      if (success) {
        setIsInitialized(true);
        setMessages([
          {
            id: 'init',
            text: `Welcome to the AoC Companion. I'm ready to help you with the ${appState.year} Day ${appState.day} puzzle using ${appState.language}. I won't solve it for you, but I'll guide you. What's sticking point?`,
            sender: Sender.AI,
            timestamp: Date.now()
          }
        ]);
      } else {
        setMessages([
          {
            id: 'error',
            text: "Failed to initialize AI. Please check your API key environment variable.",
            sender: Sender.SYSTEM,
            timestamp: Date.now()
          }
        ]);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading || !isInitialized) return;

    const userText = inputValue.trim();
    setInputValue('');
    
    // Add user message
    const newMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: Sender.USER,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(userText);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: Sender.AI,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStateChange = (updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }));
  };

  const handleResetChat = async () => {
    setMessages([]);
    setIsLoading(true);
    await initializeChat(appState);
    setMessages([{
        id: Date.now().toString(),
        text: `Chat session reset. I'm ready to help you with ${appState.year} Day ${appState.day}.`,
        sender: Sender.AI,
        timestamp: Date.now()
    }]);
    setIsLoading(false);
  };

  const handleUpdateApiKey = async () => {
    if ((window as any).aistudio) {
        try {
            await (window as any).aistudio.openSelectKey();
            // Re-initialize to pick up the new key injected into env
            await initializeChat(appState);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: "API Key updated successfully.",
                sender: Sender.SYSTEM,
                timestamp: Date.now()
            }]);
        } catch (e) {
            console.error("Failed to update API key", e);
        }
    } else {
        alert("API Key selection is not available in this environment.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-aoc-dark text-aoc-gray overflow-hidden">
      
      {/* Sidebar / Control Panel */}
      <ControlPanel 
        state={appState} 
        onStateChange={handleStateChange}
        isChatActive={messages.length > 1}
        isLoadingContext={isContextLoading}
        onRefreshContext={fetchContext}
        onResetChat={handleResetChat}
        onUpdateApiKey={handleUpdateApiKey}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="bg-slate-900 border-b border-gray-700 p-4 shadow-md z-10 flex justify-between items-center">
          <div>
            <h1 className="text-xl text-aoc-green font-bold tracking-widest text-shadow-glow">
              AoC COMPANION <span className="text-aoc-yellow">// DAY {appState.day.padStart(2, '0')}</span>
            </h1>
            <p className="text-xs text-gray-500">AI-Powered Companion • No Spoilers Mode</p>
          </div>
          <div className="hidden md:block">
            <span className="text-xs border border-aoc-green/50 text-aoc-green px-2 py-1 rounded">
              STATUS: {isLoading ? 'THINKING...' : 'ONLINE'}
            </span>
          </div>
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-gray-700">
          <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto w-full">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe your issue or paste a snippet..."
              className="w-full bg-black/30 border border-gray-600 rounded-lg pl-4 pr-12 py-4 text-sm font-mono focus:border-aoc-green focus:ring-1 focus:ring-aoc-green outline-none transition-all shadow-inner"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-aoc-green hover:text-white disabled:opacity-30 disabled:hover:text-aoc-green p-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
          <div className="text-center mt-2 flex flex-col items-center">
             <p className="text-[10px] text-gray-600">
               AI can make mistakes. Check your logic. Good luck, coder.
             </p>
             <p className="text-[9px] text-gray-700 mt-1">
               made by{' '}
               <a 
                 href="https://github.com/vuvuvu/AoC-Companion" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="hover:text-aoc-green transition-colors border-b border-dotted border-gray-700 hover:border-aoc-green"
                 title="for the clever nerds who write code from which this whole house of AI sticks is built on"
               >
                 vUvu
               </a>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;