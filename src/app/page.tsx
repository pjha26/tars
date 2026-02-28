"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";
import { SignInButton, SignOutButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

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
        <ChatApp />
      </Authenticated>
    </main>
  );
}

function ChatApp() {
  const { user } = useUser();
  const storeUser = useMutation(api.users.storeUser);

  useEffect(() => {
    if (user) {
      storeUser();
    }
  }, [user, storeUser]);

  return (
    <div className="flex w-full h-full bg-white text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col bg-slate-50/50 relative z-10">
        <div className="h-16 border-b flex justify-between items-center px-4 bg-white/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <span className="font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis w-48">
              {user?.fullName || "Welcome"}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
          <div>
            <h3 className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Users</h3>
            {/* Component to list users */}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white relative z-0">
        <div className="h-16 border-b flex items-center justify-center bg-white/50 backdrop-blur-md">
          <p className="text-sm text-slate-500 font-medium">Select a conversation to start chatting</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50/30">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-3xl">
            💬
          </div>
          <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
          <p className="text-slate-500 text-center max-w-sm">
            Send private messages to a friend. Click on a user from the sidebar to start a new conversation.
          </p>
        </div>
      </div>
    </div>
  );
}
