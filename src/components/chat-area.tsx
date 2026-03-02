"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send, Image as ImageIcon, Trash2, ChevronDown, AlertCircle, RotateCcw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { formatRelativeTime } from "@/lib/utils";

interface ChatAreaProps {
    conversationId: Id<"conversations">;
    otherUser: any;
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

export function ChatArea({ conversationId, otherUser }: ChatAreaProps) {
    const currentUser = useQuery(api.users.currentUser);
    const messages = useQuery(api.messages.getMessages, { conversationId });
    const sendMessage = useMutation(api.messages.sendMessage);
    const markRead = useMutation(api.messages.markRead);
    const deleteMessage = useMutation(api.messages.deleteMessage);
    const toggleReaction = useMutation(api.messages.toggleReaction);

    const typingUsers = useQuery(api.typing.getTypingStatus, { conversationId });
    const startTyping = useMutation(api.typing.startTyping);
    const stopTyping = useMutation(api.typing.stopTyping);

    const [newMessage, setNewMessage] = useState("");
    const [sendError, setSendError] = useState<string | null>(null);
    const [failedMessage, setFailedMessage] = useState<string | null>(null);
    const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
    const [showReactions, setShowReactions] = useState<string | null>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [hasNewMessages, setHasNewMessages] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollAnchorRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const prevMessageCountRef = useRef(0);

    // Mark as read on mount and when messages change
    useEffect(() => {
        if (messages && messages.length > 0) {
            markRead({ conversationId });
        }
    }, [messages, conversationId, markRead]);

    // Smart auto-scroll
    const checkIfAtBottom = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const threshold = 100;
        const isBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
        setIsAtBottom(isBottom);
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        container.addEventListener("scroll", checkIfAtBottom);
        return () => container.removeEventListener("scroll", checkIfAtBottom);
    }, [checkIfAtBottom]);

    useEffect(() => {
        if (!messages) return;
        const newCount = messages.length;
        const hadNewMessages = newCount > prevMessageCountRef.current;
        prevMessageCountRef.current = newCount;

        if (hadNewMessages) {
            if (isAtBottom) {
                scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
            } else {
                setHasNewMessages(true);
            }
        }
    }, [messages, isAtBottom]);

    // Initial scroll to bottom
    useEffect(() => {
        if (messages && messages.length > 0) {
            scrollAnchorRef.current?.scrollIntoView({ behavior: "instant" });
        }
    }, [conversationId]);

    const scrollToBottom = () => {
        scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
        setHasNewMessages(false);
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        startTyping({ conversationId });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping({ conversationId });
        }, 2000);
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const content = (failedMessage || newMessage).trim();
        if (!content) return;

        setNewMessage("");
        setFailedMessage(null);
        setSendError(null);
        stopTyping({ conversationId });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        try {
            await sendMessage({ conversationId, content });
        } catch (err) {
            setSendError("Failed to send message");
            setFailedMessage(content);
        }
    };

    const handleDelete = async (messageId: Id<"messages">) => {
        try {
            await deleteMessage({ messageId });
        } catch (err) {
            console.error("Failed to delete:", err);
        }
    };

    const handleReaction = async (messageId: Id<"messages">, emoji: string) => {
        try {
            await toggleReaction({ messageId, emoji });
            setShowReactions(null);
        } catch (err) {
            console.error("Failed to react:", err);
        }
    };

    // Skeleton Loader
    if (messages === undefined) {
        return (
            <div className="flex-1 flex flex-col bg-[#f5f5f7] h-full">
                {/* Header skeleton */}
                <div className="h-[72px] border-b border-black/5 flex items-center px-6 bg-white/70 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#e3e3e8] animate-pulse"></div>
                        <div className="space-y-2">
                            <div className="w-28 h-4 bg-[#e3e3e8] rounded-lg animate-pulse"></div>
                            <div className="w-16 h-3 bg-[#e3e3e8] rounded-lg animate-pulse"></div>
                        </div>
                    </div>
                </div>
                {/* Message skeletons */}
                <div className="flex-1 px-6 py-8 space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                            <div className={`rounded-2xl px-4 py-3 animate-pulse ${i % 2 === 0 ? 'bg-white border border-black/5' : 'bg-[#d4e4ff]'}`}
                                style={{ width: `${120 + Math.random() * 200}px`, height: "42px" }}></div>
                        </div>
                    ))}
                </div>
                {/* Input skeleton */}
                <div className="p-4 border-t border-black/5">
                    <div className="h-12 bg-white rounded-full animate-pulse border border-black/5"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-[#f5f5f7] relative z-0 h-full">
            {/* Header */}
            <div className="h-[72px] border-b border-black/5 flex items-center px-6 bg-white/70 backdrop-blur-xl shrink-0 justify-between z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border border-black/5 shadow-sm">
                        <AvatarImage src={otherUser?.imageUrl} />
                        <AvatarFallback>{otherUser?.name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col justify-center">
                        <h2 className="font-semibold text-[15px] text-[#1d1d1f] leading-tight">{otherUser?.name}</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            {otherUser?.isOnline ? (
                                <><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]"></span> <span className="text-[12px] text-[#86868b] font-medium leading-none">Online</span></>
                            ) : (
                                <span className="text-[12px] text-[#86868b] font-medium leading-none">Offline</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-3 relative">
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#86868b]">
                        <div className="w-20 h-20 bg-white border border-black/5 rounded-full flex items-center justify-center mb-5 text-3xl shadow-sm">👋</div>
                        <p className="text-[#1d1d1f] font-medium mb-1">Say hello to {otherUser?.name}!</p>
                        <p className="text-[13px]">Messages are end-to-end encrypted.</p>
                    </div>
                ) : (
                    messages.map((msg: any) => {
                        const isMe = currentUser && msg.senderId === currentUser._id;
                        const isHovered = hoveredMsgId === msg._id;

                        return (
                            <div
                                key={msg._id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full group`}
                                onMouseEnter={() => { setHoveredMsgId(msg._id); }}
                                onMouseLeave={() => { setHoveredMsgId(null); setShowReactions(null); }}
                            >
                                <div className={`flex items-end gap-2 max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {!isMe && (
                                        <Avatar className="w-7 h-7 shrink-0 hidden md:block border border-black/5 mt-auto mb-5">
                                            <AvatarImage src={otherUser?.imageUrl} />
                                            <AvatarFallback className="text-[10px]">{otherUser?.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className="flex flex-col relative">
                                        {/* Message Bubble */}
                                        {msg.isDeleted ? (
                                            <div className="rounded-2xl px-4 py-[10px] bg-[#e3e3e8]/50 border border-black/5 rounded-bl-sm">
                                                <p className="text-[14px] italic text-[#86868b]">This message was deleted</p>
                                            </div>
                                        ) : (
                                            <div className={`rounded-2xl px-4 py-[10px] shadow-sm relative ${isMe ? 'bg-[#007AFF] text-white rounded-br-sm' : 'bg-white border border-black/5 text-[#1d1d1f] rounded-bl-sm'}`}>
                                                <p className="text-[15px] leading-relaxed break-words">{msg.content}</p>
                                            </div>
                                        )}

                                        {/* Reactions display */}
                                        {msg.reactions && msg.reactions.length > 0 && !msg.isDeleted && (
                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                {msg.reactions.map((r: any, i: number) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleReaction(msg._id, r.emoji)}
                                                        className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[12px] border transition-all hover:scale-105 ${r.userIds.includes(currentUser?._id)
                                                                ? 'bg-[#007AFF]/10 border-[#007AFF]/30 text-[#007AFF]'
                                                                : 'bg-white border-black/10 text-[#1d1d1f]'
                                                            }`}
                                                    >
                                                        <span>{r.emoji}</span>
                                                        <span className="font-medium">{r.userIds.length}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Timestamp */}
                                        <span className={`text-[11px] font-medium mt-1 select-none transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'} ${isMe ? 'text-[#86868b] text-right pr-1' : 'text-[#86868b] pl-1'}`}>
                                            {formatRelativeTime(msg._creationTime)}
                                        </span>

                                        {/* Hover action bar */}
                                        {isHovered && !msg.isDeleted && (
                                            <div className={`absolute ${isMe ? '-left-20' : '-right-20'} top-0 flex items-center gap-1 bg-white border border-black/10 rounded-xl px-1.5 py-1 shadow-lg z-20`}>
                                                <button
                                                    onClick={() => setShowReactions(showReactions === msg._id ? null : msg._id)}
                                                    className="text-[14px] hover:scale-110 transition-transform px-1"
                                                    title="React"
                                                >
                                                    😊
                                                </button>
                                                {isMe && (
                                                    <button
                                                        onClick={() => handleDelete(msg._id)}
                                                        className="text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg p-1 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Reaction picker */}
                                        {showReactions === msg._id && (
                                            <div className={`absolute ${isMe ? '-left-4' : '-right-4'} -top-10 flex items-center gap-1 bg-white border border-black/10 rounded-2xl px-2 py-1.5 shadow-xl z-30`}>
                                                {REACTION_EMOJIS.map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleReaction(msg._id, emoji)}
                                                        className="text-[18px] hover:scale-125 transition-transform px-0.5"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Typing Indicator */}
                {typingUsers && typingUsers.length > 0 && (
                    <div className="flex justify-start w-full">
                        <div className="flex items-end gap-2 max-w-[75%]">
                            <Avatar className="w-7 h-7 shrink-0 hidden md:block border border-black/5 mt-auto mb-1">
                                <AvatarImage src={typingUsers[0]?.imageUrl} />
                                <AvatarFallback className="text-[10px]">{typingUsers[0]?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="bg-white border border-black/5 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center h-[42px]">
                                <div className="flex items-center gap-1.5 opacity-60">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#86868b] animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#86868b] animate-bounce [animation-delay:0.15s]"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#86868b] animate-bounce [animation-delay:0.3s]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={scrollAnchorRef} className="h-2"></div>
            </div>

            {/* "New messages" button (smart scroll) */}
            {hasNewMessages && !isAtBottom && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-4 py-2 bg-[#007AFF] text-white rounded-full shadow-lg shadow-[#007AFF]/25 text-[13px] font-medium hover:bg-[#0066CC] transition-all active:scale-95"
                >
                    <ChevronDown className="w-4 h-4" />
                    New messages
                </button>
            )}

            {/* Error banner */}
            {sendError && (
                <div className="px-6 py-2 bg-[#FF3B30]/10 border-t border-[#FF3B30]/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#FF3B30]">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-[13px] font-medium">{sendError}</span>
                    </div>
                    <button
                        onClick={() => handleSend()}
                        className="flex items-center gap-1 text-[13px] font-semibold text-[#007AFF] hover:underline"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Retry
                    </button>
                </div>
            )}

            {/* Input */}
            <div className="p-4 bg-[#f5f5f7] shrink-0 border-t border-black/5 w-full">
                <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto w-full relative">
                    <Button type="button" variant="ghost" size="icon" className="text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/5 absolute left-2 z-10 w-9 h-9 rounded-full">
                        <ImageIcon className="w-[18px] h-[18px]" />
                    </Button>
                    <Input
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder="Type a message..."
                        className="flex-1 bg-white border border-black/10 shadow-sm focus-visible:ring-1 focus-visible:ring-[#007AFF]/30 focus-visible:border-[#007AFF] rounded-full pl-12 pr-14 py-6 text-[15px] transition-all"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="absolute right-2 z-10 rounded-full bg-[#007AFF] hover:bg-[#007AFF]/90 shadow-sm shrink-0 h-9 w-9 disabled:opacity-0 disabled:scale-75 transition-all duration-200 ease-out"
                        disabled={!newMessage.trim() && !failedMessage}
                    >
                        <Send className="w-4 h-4 ml-0.5 text-white" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
