"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Search, Loader2, Users, X, Plus, Check } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { Id } from "../../convex/_generated/dataModel";

interface ChatSidebarProps {
    onSelectConversation: (id: Id<"conversations">, otherUser: any) => void;
    selectedConversationId?: Id<"conversations">;
}

export function ChatSidebar({ onSelectConversation, selectedConversationId }: ChatSidebarProps) {
    const { user } = useUser();
    const [searchTerm, setSearchTerm] = useState("");
    const [showGroupDialog, setShowGroupDialog] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<Id<"users">[]>([]);

    const users = useQuery(api.users.getUsers, { searchTerm });
    const allUsers = useQuery(api.users.getUsers, {});
    const conversations = useQuery(api.conversations.getMyConversations);
    const createConversation = useMutation(api.conversations.getOrCreateConversation);
    const createGroup = useMutation(api.conversations.createGroupConversation);

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

    const toggleMember = (userId: Id<"users">) => {
        setSelectedMembers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedMembers.length < 2) return;
        try {
            const convId = await createGroup({ name: groupName, memberIds: selectedMembers });
            setShowGroupDialog(false);
            setGroupName("");
            setSelectedMembers([]);
            onSelectConversation(convId, { name: groupName, isGroup: true });
        } catch (error) {
            console.error(error);
        }
    };

    const isSearching = searchTerm.trim().length > 0;

    return (
        <div className="w-80 md:w-96 border-r border-black/5 flex flex-col bg-[#f5f5f7] relative z-10 transition-all h-full">
            {/* Header */}
            <div className="h-[72px] border-b border-black/5 flex justify-between items-center px-5 bg-white/70 backdrop-blur-xl shrink-0 z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <UserButton afterSignOutUrl="/" />
                    <span className="font-semibold text-[15px] text-[#1d1d1f] whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                        {user?.fullName || "Welcome"}
                    </span>
                </div>
                <button
                    onClick={() => setShowGroupDialog(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#007AFF] text-white rounded-lg text-[13px] font-medium hover:bg-[#0066CC] transition-colors shadow-sm"
                    title="New Group Chat"
                >
                    <Users className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Group</span>
                </button>
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
                            <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-black/5 shadow-sm mt-2 mx-2">
                                <div className="w-12 h-12 bg-[#f5f5f7] rounded-full flex items-center justify-center mb-3 text-xl">🔍</div>
                                <p className="text-[14px] font-medium text-[#1d1d1f]">No results</p>
                                <p className="text-[13px] text-[#86868b] mt-0.5">No users found for &ldquo;{searchTerm}&rdquo;</p>
                            </div>
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
                            // Skeleton Loaders
                            <div className="flex flex-col gap-2 px-1">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                                        <div className="w-[46px] h-[46px] rounded-full bg-[#e3e3e8] animate-pulse shrink-0"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="w-24 h-4 bg-[#e3e3e8] rounded animate-pulse"></div>
                                            <div className="w-40 h-3 bg-[#e3e3e8] rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                    const isGroup = c.isGroup;
                                    const displayName = isGroup ? c.name : targetUser?.name;
                                    if (!displayName) return null;

                                    return (
                                        <button
                                            key={c._id}
                                            onClick={() => onSelectConversation(c._id, isGroup ? { name: c.name, isGroup: true } : targetUser)}
                                            className={`flex items-start gap-3 p-3 rounded-xl transition-colors text-left w-full group ${isActive ? 'bg-[#007AFF] shadow-sm' : 'hover:bg-white/60 active:bg-black/5'}`}
                                        >
                                            <div className="relative shrink-0">
                                                {isGroup ? (
                                                    <div className={`w-[46px] h-[46px] rounded-full flex items-center justify-center text-lg border border-black/5 shadow-sm ${isActive ? 'bg-white/20' : 'bg-gradient-to-br from-[#007AFF]/20 to-[#5856D6]/20'}`}>
                                                        <Users className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#007AFF]'}`} />
                                                    </div>
                                                ) : (
                                                    <Avatar className="w-[46px] h-[46px] border border-black/5 shadow-sm bg-white">
                                                        <AvatarImage src={targetUser?.imageUrl} />
                                                        <AvatarFallback className={isActive ? 'text-[#007AFF]' : ''}>{targetUser?.name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                )}
                                                {!isGroup && targetUser?.isOnline && !isActive && (
                                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-[2.5px] border-[#f5f5f7] group-hover:border-white rounded-full z-10 transition-colors"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 overflow-hidden min-w-0 py-0.5">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <p className={`font-semibold text-[15px] truncate ${isActive ? 'text-white' : 'text-[#1d1d1f]'}`}>{displayName}</p>
                                                    <span className={`text-[12px] whitespace-nowrap ml-2 ${isActive ? 'text-blue-100' : 'text-[#86868b]'}`}>
                                                        {c.updatedAt ? formatRelativeTime(c.updatedAt) : ""}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center gap-2">
                                                    <p className={`text-[13px] truncate ${isActive
                                                        ? 'text-blue-100'
                                                        : (!c.hasReadLastMessage ? 'text-[#1d1d1f] font-semibold' : 'text-[#86868b]')
                                                        }`}>
                                                        {c.lastMessage?.isDeleted ? "This message was deleted" : (c.lastMessage?.content || "Started a conversation")}
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

            {/* Group Chat Creation Dialog */}
            {showGroupDialog && (
                <div className="absolute inset-0 bg-white z-50 flex flex-col">
                    <div className="h-[72px] border-b border-black/5 flex justify-between items-center px-5 bg-white shrink-0">
                        <h3 className="font-semibold text-[17px] text-[#1d1d1f]">New Group</h3>
                        <button onClick={() => { setShowGroupDialog(false); setSelectedMembers([]); setGroupName(""); }} className="text-[#86868b] hover:text-[#1d1d1f]">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="px-5 py-4 border-b border-black/5">
                        <Input
                            placeholder="Group name..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="border-none bg-[#f5f5f7] rounded-xl text-[15px] h-10"
                        />
                    </div>
                    <div className="px-5 py-2">
                        <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                            Select members ({selectedMembers.length} selected)
                        </p>
                    </div>
                    <ScrollArea className="flex-1 px-3">
                        <div className="flex flex-col gap-1">
                            {allUsers?.map((u: any) => {
                                const isSelected = selectedMembers.includes(u._id);
                                return (
                                    <button
                                        key={u._id}
                                        onClick={() => toggleMember(u._id)}
                                        className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left ${isSelected ? 'bg-[#007AFF]/10' : 'hover:bg-[#f5f5f7]'}`}
                                    >
                                        <Avatar className="w-10 h-10 border border-black/5">
                                            <AvatarImage src={u.imageUrl} />
                                            <AvatarFallback>{u.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <p className="flex-1 font-medium text-[15px] text-[#1d1d1f]">{u.name}</p>
                                        {isSelected && (
                                            <div className="w-6 h-6 rounded-full bg-[#007AFF] flex items-center justify-center">
                                                <Check className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                    <div className="p-5 border-t border-black/5">
                        <Button
                            onClick={handleCreateGroup}
                            disabled={!groupName.trim() || selectedMembers.length < 2}
                            className="w-full bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-xl h-12 text-[15px] font-semibold disabled:opacity-40 shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Group ({selectedMembers.length} members)
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
