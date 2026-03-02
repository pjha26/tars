import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Search, Loader2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils"; // We'll create this later
import { Id } from "../../convex/_generated/dataModel";

interface ChatSidebarProps {
    onSelectConversation: (id: Id<"conversations">, otherUser: any) => void;
    selectedConversationId?: Id<"conversations">;
}

export function ChatSidebar({ onSelectConversation, selectedConversationId }: ChatSidebarProps) {
    const { user } = useUser();
    const [searchTerm, setSearchTerm] = useState("");

    const users = useQuery(api.users.getUsers, { searchTerm });
    const conversations = useQuery(api.conversations.getMyConversations);
    const createConversation = useMutation(api.conversations.getOrCreateConversation);

    const [isLoadingConv, setIsLoadingConv] = useState(false);

    const handleStartChat = async (userId: Id<"users">, otherUser: any) => {
        setIsLoadingConv(true);
        try {
            const convId = await createConversation({ otherUserId: userId });
            onSelectConversation(convId, otherUser);
            setSearchTerm("");
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingConv(false);
        }
    };

    const isSearching = searchTerm.trim().length > 0;

    return (
        <div className="w-80 md:w-96 border-r border-black/5 flex flex-col bg-[#f5f5f7] relative z-10 transition-all">
            {/* Header */}
            <div className="h-[72px] border-b border-black/5 flex justify-between items-center px-5 bg-white/70 backdrop-blur-xl shrink-0 z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <UserButton afterSignOutUrl="/" />
                    <span className="font-semibold text-[15px] text-[#1d1d1f] whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                        {user?.fullName || "Welcome"}
                    </span>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 py-3 bg-[#f5f5f7] shrink-0">
                <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b] group-focus-within:text-[#007AFF] transition-colors" />
                    <Input
                        placeholder="Search users..."
                        className="pl-10 bg-[#e3e3e8] hover:bg-[#d1d1d6] focus:bg-white border-none shadow-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/20 rounded-xl h-9 text-[15px] transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List Area */}
            <ScrollArea className="flex-1 px-3">
                {isSearching ? (
                    <div className="py-2">
                        <h3 className="px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-2">Search Results</h3>
                        {users === undefined ? (
                            <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-[#86868b]" /></div>
                        ) : users.length === 0 ? (
                            <div className="text-center p-6 text-[13px] text-[#86868b]">No users found for "{searchTerm}"</div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {users.map((u: any) => (
                                    <button
                                        key={u._id}
                                        onClick={() => handleStartChat(u._id, u)}
                                        disabled={isLoadingConv}
                                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/60 active:bg-black/5 transition-colors text-left"
                                    >
                                        <div className="relative">
                                            <Avatar className="w-[42px] h-[42px] border border-black/5">
                                                <AvatarImage src={u.imageUrl} />
                                                <AvatarFallback>{u.name[0]}</AvatarFallback>
                                            </Avatar>
                                            {u.isOnline && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-[2.5px] border-[#f5f5f7] rounded-full"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-semibold text-[15px] text-[#1d1d1f] truncate leading-tight">{u.name}</p>
                                            <p className="text-[13px] text-[#86868b] truncate mt-0.5">{u.isOnline ? "Online" : "Offline"}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-2">
                        <h3 className="px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-2">Recent Chats</h3>
                        {conversations === undefined ? (
                            <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-[#86868b]" /></div>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-black/5 shadow-sm mt-4 mx-2">
                                <div className="w-14 h-14 bg-blue-50/50 text-[#007AFF] rounded-full flex items-center justify-center mb-3 text-2xl">💬</div>
                                <p className="text-[15px] font-semibold text-[#1d1d1f]">No messages</p>
                                <p className="text-[13px] text-[#86868b] mt-1 max-w-[200px] leading-relaxed">Search for a user above to start your first chat.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {conversations.map((c: any) => {
                                    const isActive = selectedConversationId === c._id;
                                    const targetUser = c.otherUser;
                                    if (!targetUser) return null;

                                    return (
                                        <button
                                            key={c._id}
                                            onClick={() => onSelectConversation(c._id, targetUser)}
                                            className={`flex items-start gap-3 p-3 rounded-xl transition-colors text-left w-full group ${isActive ? 'bg-[#007AFF] shadow-sm' : 'hover:bg-white/60 active:bg-black/5'}`}
                                        >
                                            <div className="relative shrink-0">
                                                <Avatar className="w-[46px] h-[46px] border border-black/5 shadow-sm bg-white">
                                                    <AvatarImage src={targetUser.imageUrl} />
                                                    <AvatarFallback className={isActive ? 'text-[#007AFF]' : ''}>{targetUser.name[0]}</AvatarFallback>
                                                </Avatar>
                                                {targetUser.isOnline && !isActive && (
                                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-[2.5px] border-[#f5f5f7] group-hover:border-white rounded-full z-10 transition-colors"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 overflow-hidden min-w-0 py-0.5">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <p className={`font-semibold text-[15px] truncate ${isActive ? 'text-white' : 'text-[#1d1d1f]'}`}>{targetUser.name}</p>
                                                    <span className={`text-[12px] whitespace-nowrap ml-2 ${isActive ? 'text-blue-100' : 'text-[#86868b]'}`}>
                                                        {c.updatedAt ? formatRelativeTime(c.updatedAt) : ""}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center gap-2">
                                                    <p className={`text-[13px] truncate ${isActive
                                                            ? 'text-blue-100'
                                                            : (!c.hasReadLastMessage ? 'text-[#1d1d1f] font-semibold' : 'text-[#86868b]')
                                                        }`}>
                                                        {c.lastMessage?.content || "Started a conversation"}
                                                    </p>
                                                    {c.unreadCount > 0 && !isActive && (
                                                        <Badge variant="default" className="bg-[#007AFF] hover:bg-[#007AFF] px-1.5 py-0 h-5 min-w-[20px] shrink-0 text-[11px] font-semibold rounded-full flex items-center justify-center border-none shadow-sm shadow-[#007AFF]/20">
                                                            {c.unreadCount}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
