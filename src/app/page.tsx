"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatArea } from "@/components/chat-area";
import { Id } from "../../convex/_generated/dataModel";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { MessageCircle, ArrowLeft, Zap, Shield, Users } from "lucide-react";

export default function Home() {
  return (
    <main className="flex h-screen w-full bg-[#f5f5f7]">
      <AuthLoading>
        <div className="flex h-full w-full items-center justify-center bg-[#f5f5f7]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-lg shadow-[#007AFF]/20 animate-pulse">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#007AFF] animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-[#007AFF] animate-bounce [animation-delay:0.15s]"></div>
              <div className="w-2 h-2 rounded-full bg-[#007AFF] animate-bounce [animation-delay:0.3s]"></div>
            </div>
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex h-full w-full items-center justify-center flex-col gap-8 bg-gradient-to-b from-[#f5f5f7] to-white px-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-2xl shadow-[#007AFF]/30">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <div className="text-center space-y-3">
              <h1 className="text-5xl font-bold tracking-tight text-[#1d1d1f]">
                Tars Live Chat
              </h1>
              <p className="text-lg text-[#86868b] max-w-md mx-auto leading-relaxed">
                Connect and message with others in real-time. Fast, secure, and beautifully simple.
              </p>
            </div>
          </div>

          {/* Feature Pills */}
          <div className="flex gap-3 flex-wrap justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-black/5 shadow-sm">
              <Zap className="w-4 h-4 text-[#FF9500]" />
              <span className="text-[13px] font-medium text-[#1d1d1f]">Real-time</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-black/5 shadow-sm">
              <Shield className="w-4 h-4 text-[#34C759]" />
              <span className="text-[13px] font-medium text-[#1d1d1f]">Encrypted</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-black/5 shadow-sm">
              <Users className="w-4 h-4 text-[#007AFF]" />
              <span className="text-[13px] font-medium text-[#1d1d1f]">1-on-1 Chat</span>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="flex gap-3">
            <SignInButton mode="modal">
              <button className="px-8 py-3 bg-[#007AFF] text-white font-semibold rounded-xl hover:bg-[#0066CC] transition-all shadow-lg shadow-[#007AFF]/25 active:scale-[0.98]">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-8 py-3 bg-white border border-black/10 text-[#1d1d1f] font-semibold rounded-xl hover:bg-[#f5f5f7] transition-all shadow-sm active:scale-[0.98]">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        </div>
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedApp />
      </Authenticated>
    </main>
  );
}

function AuthenticatedApp() {
  useOnlineStatus();
  return <ChatApp />;
}

function ChatApp() {
  const { user } = useUser();
  const storeUser = useMutation(api.users.storeUser);

  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    if (user) {
      storeUser();
    }
  }, [user, storeUser]);

  const handleSelectConversation = (convId: Id<"conversations">, otherUser: any) => {
    setSelectedConversationId(convId);
    setSelectedUser(otherUser);
  };

  const clearSelection = () => {
    setSelectedConversationId(null);
    setSelectedUser(null);
  };

  return (
    <div className="flex w-full h-full bg-[#f5f5f7] text-[#1d1d1f] overflow-hidden">
      {/* Sidebar - hidden on mobile if conversation is selected */}
      <div className={`shrink-0 h-full ${selectedConversationId ? 'hidden md:flex' : 'flex w-full md:w-auto'}`}>
        <ChatSidebar
          onSelectConversation={handleSelectConversation}
          selectedConversationId={selectedConversationId || undefined}
        />
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col h-full bg-[#f5f5f7] relative z-0 ${!selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
        {!selectedConversationId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#007AFF]/10 to-[#5856D6]/10 rounded-3xl flex items-center justify-center mb-6">
              <MessageCircle className="w-10 h-10 text-[#007AFF]" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-[#1d1d1f]">Your Messages</h2>
            <p className="text-[#86868b] text-center max-w-sm text-[15px] leading-relaxed">
              Send private messages to a friend. Click on a user from the sidebar to start a new conversation.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full relative">
            {/* Mobile Back Button */}
            <div className="md:hidden bg-white/70 backdrop-blur-xl border-b border-black/5 px-4 py-3 flex items-center shrink-0 z-20 sticky top-0">
              <button
                onClick={clearSelection}
                className="flex items-center gap-1 text-[#007AFF] font-medium text-[15px] hover:opacity-70 transition-opacity"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            </div>
            <div className="flex-1 h-full w-full">
              <ChatArea
                conversationId={selectedConversationId}
                otherUser={selectedUser}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
