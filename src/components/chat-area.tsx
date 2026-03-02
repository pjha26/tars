import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useRef, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { formatRelativeTime } from "@/lib/utils";

interface ChatAreaProps {
    conversationId: Id<"conversations">;
    otherUser: any;
}

export function ChatArea({ conversationId, otherUser }: ChatAreaProps) {
    const currentUser = useQuery(api.users.currentUser);
    const messages = useQuery(api.messages.getMessages, { conversationId });
    const sendMessage = useMutation(api.messages.sendMessage);
    const markRead = useMutation(api.messages.markRead);

    const typingUsers = useQuery(api.typing.getTypingStatus, { conversationId });
    const startTyping = useMutation(api.typing.startTyping);
    const stopTyping = useMutation(api.typing.stopTyping);

    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (messages) {
            if (scrollRef.current) {
                scrollRef.current.scrollIntoView({ behavior: "smooth" });
            }
            markRead({ conversationId });
        }
    }, [messages, conversationId, markRead]);

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        startTyping({ conversationId });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            stopTyping({ conversationId });
        }, 2000);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage.trim();
        setNewMessage("");
        stopTyping({ conversationId });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        await sendMessage({ conversationId, content });
    };

    return (
        <div className="flex-1 flex flex-col bg-[#f5f5f7] relative z-0 h-full">
            {/* Header - Apple Style Glassmorphism */}
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
            <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-3">
                {messages === undefined ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-[#d2d2d7] animate-bounce"></div>
                            <div className="w-2 h-2 rounded-full bg-[#d2d2d7] animate-bounce delay-150"></div>
                            <div className="w-2 h-2 rounded-full bg-[#d2d2d7] animate-bounce delay-300"></div>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#86868b]">
                        <div className="w-20 h-20 bg-white border border-black/5 rounded-full flex items-center justify-center mb-5 text-3xl shadow-sm">👋</div>
                        <p className="text-[#1d1d1f] font-medium mb-1">Say hello to {otherUser?.name}!</p>
                        <p className="text-[13px]">Messages are end-to-end encrypted.</p>
                    </div>
                ) : (
                    messages.map((msg: any) => {
                        const isMe = currentUser && msg.senderId === currentUser._id;
                        return (
                            <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`flex items-end gap-2 max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {!isMe && (
                                        <Avatar className="w-7 h-7 shrink-0 hidden md:block border border-black/5 mt-auto mb-1">
                                            <AvatarImage src={otherUser?.imageUrl} />
                                            <AvatarFallback className="text-[10px]">{otherUser?.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className="flex flex-col group relative">
                                        <div className={`rounded-2xl px-4 py-[10px] shadow-sm relative ${isMe ? 'bg-[#007AFF] text-white rounded-br-sm' : 'bg-white border border-black/5 text-[#1d1d1f] rounded-bl-sm'
                                            }`}>
                                            <p className="text-[15px] leading-relaxed break-words tracking-tight">{msg.content}</p>
                                        </div>
                                        <span className={`text-[11px] font-medium mt-1 select-none transition-opacity opacity-0 group-hover:opacity-100 ${isMe ? 'text-[#86868b] text-right pr-1' : 'text-[#86868b] pl-1'}`}>
                                            {formatRelativeTime(msg._creationTime)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Typing Indicator */}
                {typingUsers && typingUsers.length > 0 && (
                    <div className="flex justify-start w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-end gap-2 max-w-[75%]">
                            <Avatar className="w-7 h-7 shrink-0 hidden md:block border border-black/5 mt-auto mb-1">
                                <AvatarImage src={typingUsers[0]?.imageUrl} />
                                <AvatarFallback className="text-[10px]">{typingUsers[0]?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="bg-white border border-black/5 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center h-[42px]">
                                <div className="flex items-center gap-1.5 opacity-60">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#86868b] animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#86868b] animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#86868b] animate-bounce [animation-delay:-0.3s]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={scrollRef} className="h-2"></div>
            </div>

            {/* Input - Apple Style */}
            <div className="p-4 bg-[#f5f5f7] shrink-0 border-t border-black/5 w-full">
                <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto w-full relative">
                    <Button type="button" variant="ghost" size="icon" className="text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/5 absolute left-2 z-10 w-9 h-9 rounded-full">
                        <ImageIcon className="w-[18px] h-[18px]" />
                    </Button>
                    <Input
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder="iMessage"
                        className="flex-1 bg-white border border-black/10 shadow-sm focus-visible:ring-1 focus-visible:ring-[#007AFF]/30 focus-visible:border-[#007AFF] rounded-full pl-12 pr-14 py-6 text-[15px] transition-all"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="absolute right-2 z-10 rounded-full bg-[#007AFF] hover:bg-[#007AFF]/90 shadow-sm shrink-0 h-9 w-9 disabled:opacity-0 disabled:scale-75 transition-all duration-200 ease-out"
                        disabled={!newMessage.trim()}
                    >
                        <Send className="w-4 h-4 ml-0.5 text-white" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
