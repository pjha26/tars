import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreateConversation = mutation({
    args: {
        otherUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser) throw new Error("User not found");

        const myMemberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .collect();

        const otherMemberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_userId", (q) => q.eq("userId", args.otherUserId))
            .collect();

        const myConversationIds = new Set(myMemberships.map((m) => m.conversationId));
        const sharedConversationIds = otherMemberships
            .map((m) => m.conversationId)
            .filter((id) => myConversationIds.has(id));

        for (const convId of sharedConversationIds) {
            const conversation = await ctx.db.get(convId);
            if (conversation && !conversation.isGroup) {
                return convId;
            }
        }

        const newConversationId = await ctx.db.insert("conversations", {
            isGroup: false,
            updatedAt: Date.now(),
        });

        await ctx.db.insert("conversationMembers", {
            conversationId: newConversationId,
            userId: currentUser._id,
            hasReadLastMessage: true,
        });

        await ctx.db.insert("conversationMembers", {
            conversationId: newConversationId,
            userId: args.otherUserId,
            hasReadLastMessage: false,
        });

        return newConversationId;
    }
});

export const getMyConversations = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser) return [];

        const memberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .collect();

        const conversationsWithDetails = await Promise.all(
            memberships.map(async (m) => {
                const conversation = await ctx.db.get(m.conversationId);
                if (!conversation) return null;

                const allMembers = await ctx.db
                    .query("conversationMembers")
                    .withIndex("by_conversationId", (q) => q.eq("conversationId", m.conversationId))
                    .collect();

                const otherMembers = allMembers.filter((mbr) => mbr.userId !== currentUser._id);

                let otherUser = null;
                if (!conversation.isGroup && otherMembers.length > 0) {
                    otherUser = await ctx.db.get(otherMembers[0].userId);
                }

                let lastMessage = null;
                if (conversation.lastMessageId) {
                    lastMessage = await ctx.db.get(conversation.lastMessageId);
                }

                let unreadCount = 0;
                // Get unread count explicitly if needed, but for now we just use the hasRead flag inside membership
                // Or better yet, we can fetch from unreadCounts table if we use that. The requirements say:
                // "Show a badge on each conversation in the sidebar with the number of unread messages"
                const unreadCountRow = await ctx.db
                    .query("unreadCounts")
                    .withIndex("by_conversation_and_user", (q) =>
                        q.eq("conversationId", m.conversationId).eq("userId", currentUser._id)
                    )
                    .unique();
                unreadCount = unreadCountRow?.count || 0;

                return {
                    ...conversation,
                    otherUser,
                    hasReadLastMessage: m.hasReadLastMessage,
                    lastMessage,
                    unreadCount,
                    memberCount: allMembers.length,
                };
            })
        );

        return conversationsWithDetails
            .filter((c) => c !== null)
            .sort((a, b) => b.updatedAt - a.updatedAt);
    }
});

// Create a group conversation
export const createGroupConversation = mutation({
    args: {
        name: v.string(),
        memberIds: v.array(v.id("users")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser) throw new Error("User not found");

        if (args.memberIds.length < 2) throw new Error("Group chat needs at least 2 other members");

        const conversationId = await ctx.db.insert("conversations", {
            isGroup: true,
            name: args.name,
            updatedAt: Date.now(),
        });

        // Add creator
        await ctx.db.insert("conversationMembers", {
            conversationId,
            userId: currentUser._id,
            hasReadLastMessage: true,
        });

        // Add other members
        for (const memberId of args.memberIds) {
            await ctx.db.insert("conversationMembers", {
                conversationId,
                userId: memberId,
                hasReadLastMessage: false,
            });
        }

        return conversationId;
    }
});
