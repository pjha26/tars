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

export default function Home() {
  return (
    <main className="flex h-screen w-full">
      <AuthLoading>
        <div className="flex h-full w-full items-center justify-center bg-slate-50">
          <div className="animate-pulse flex items-center gap-2 text-slate-500">
            <div className="w-4 h-4 rounded-full bg-slate-400 animate-bounce"></div>
            <div className="w-4 h-4 rounded-full bg-slate-400 animate-bounce delay-75"></div>
            <div className="w-4 h-4 rounded-full bg-slate-400 animate-bounce delay-150"></div>
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex bg-slate-50 h-full w-full items-center justify-center flex-col gap-6">
          <div className="text-center space-y-2">
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">Tars Live Chat</h1>
            <p className="text-lg text-slate-500 max-w-sm mx-auto">Connect and message with others in real-time, instantly.</p>
          </div>
          <div className="flex gap-4">
            <SignInButton mode="modal">
              <button className="px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-6 py-3 bg-white border border-slate-200 text-slate-900 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">Sign Up</button>
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
    <div className="flex w-full h-full bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar - hidden on mobile if conversation is selected */}
      <div className={`shrink-0 h-full border-r bg-slate-50 ${selectedConversationId ? 'hidden md:flex' : 'flex w-full md:w-auto'}`}>
        <ChatSidebar
          onSelectConversation={handleSelectConversation}
          selectedConversationId={selectedConversationId || undefined}
        />
      </div>

      {/* Main Chat Area - hidden on mobile if no conversation is selected */}
      <div className={`flex-1 flex flex-col h-full bg-white relative z-0 ${!selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
        {!selectedConversationId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50/30">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 text-3xl shadow-sm">
              💬
            </div>
            <h2 className="text-xl font-semibold mb-2 text-slate-800">Your Messages</h2>
            <p className="text-slate-500 text-center max-w-sm">
              Send private messages to a friend. Click on a user from the sidebar to start a new conversation.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Mobile Back Button */}
            <div className="md:hidden bg-white/80 backdrop-blur-md border-b px-2 py-2 flex items-center shrink-0 z-10 absolute top-0 left-0 w-full h-16">
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 text-sm hover:bg-slate-100 rounded-md font-medium text-slate-600 flex items-center gap-1 z-20 absolute left-2"
              >
                ← Back
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
