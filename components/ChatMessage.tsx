import React from 'react';
import { Message, Sender } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

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
        className={`max-w-[85%] rounded-lg p-4 shadow-lg ${
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
