"use client";

import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";

interface ChatMessage {
  text: string;
  timestamp: number;
}

interface AvatarChatBoxProps {
  messages: ChatMessage[];
}

export default function AvatarChatBox({ messages }: AvatarChatBoxProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full h-full flex flex-col bg-white/5 rounded-lg border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center space-x-2 px-4 py-3 bg-white/10 border-b border-white/20">
        <MessageSquare className="w-5 h-5 text-blue-400" />
        <h3 className="text-sm font-semibold text-white">Interviewer Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/50 text-sm">
            <p>Waiting for interviewer...</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 animate-fade-in"
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-xs font-medium text-blue-300">AI Interviewer</span>
                <span className="text-xs text-white/50">{formatTime(message.timestamp)}</span>
              </div>
              <p className="text-sm text-white/90 leading-relaxed">{message.text}</p>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Footer indicator */}
      <div className="px-4 py-2 bg-white/5 border-t border-white/20">
        <p className="text-xs text-white/50 text-center">
          All messages from the AI interviewer appear here
        </p>
      </div>
    </div>
  );
}
