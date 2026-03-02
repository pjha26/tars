import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get messages for a conversation
export const getMessages = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Verify membership
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return [];

        const isMember = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversation_and_user", (q) =>
                q.eq("conversationId", args.conversationId).eq("userId", currentUser._id)
            )
            .unique();

        if (!isMember) return [];

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        return messages;
    }
});

// Send a message
export const sendMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const sender = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!sender) throw new Error("User not found");

        const isMember = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversation_and_user", (q) =>
                q.eq("conversationId", args.conversationId).eq("userId", sender._id)
            )
            .unique();

        if (!isMember) throw new Error("Not a member of this conversation");

        // Insert message
        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: sender._id,
            content: args.content,
            isDeleted: false,
        });

        // Update conversation lastMessageId and updatedAt
        await ctx.db.patch(args.conversationId, {
            lastMessageId: messageId,
            updatedAt: Date.now(),
        });

        // Find other members to update their unread status
        const otherMembers = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .filter((q) => q.neq(q.field("userId"), sender._id))
            .collect();

        for (const member of otherMembers) {
            await ctx.db.patch(member._id, {
                hasReadLastMessage: false,
            });

            // Also update unread counts (if using unreadCounts table)
            const unreadCountRow = await ctx.db
                .query("unreadCounts")
                .withIndex("by_conversation_and_user", (q) =>
                    q.eq("conversationId", args.conversationId).eq("userId", member.userId)
                )
                .unique();

            if (unreadCountRow) {
                await ctx.db.patch(unreadCountRow._id, { count: unreadCountRow.count + 1 });
            } else {
                await ctx.db.insert("unreadCounts", {
                    conversationId: args.conversationId,
                    userId: member.userId,
                    count: 1,
                });
            }
        }

        // self read
        await ctx.db.patch(isMember._id, {
            hasReadLastMessage: true,
        });

        return messageId;
    }
});

// Mark conversation as read
export const markRead = mutation({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return;

        const isMember = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversation_and_user", (q) =>
                q.eq("conversationId", args.conversationId).eq("userId", currentUser._id)
            )
            .unique();

        if (isMember) {
            await ctx.db.patch(isMember._id, {
                hasReadLastMessage: true,
            });

            // Clear unread count
            const unreadCountRow = await ctx.db
                .query("unreadCounts")
                .withIndex("by_conversation_and_user", (q) =>
                    q.eq("conversationId", args.conversationId).eq("userId", currentUser._id)
                )
                .unique();

            if (unreadCountRow) {
                await ctx.db.patch(unreadCountRow._id, { count: 0 });
            }
        }
    }
});
