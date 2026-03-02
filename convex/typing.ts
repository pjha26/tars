import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const startTyping = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return;

        const existing = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversation_and_user", (q) =>
                q.eq("conversationId", args.conversationId).eq("userId", user._id))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { isTyping: true, updatedAt: Date.now() });
        } else {
            await ctx.db.insert("typingIndicators", {
                conversationId: args.conversationId,
                userId: user._id,
                isTyping: true,
                updatedAt: Date.now()
            });
        }
    }
});

export const stopTyping = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return;

        const existing = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversation_and_user", (q) =>
                q.eq("conversationId", args.conversationId).eq("userId", user._id))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { isTyping: false });
        }
    }
});

export const getTypingStatus = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return [];

        const typingDocs = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversation_and_user", (q) => q.eq("conversationId", args.conversationId))
            .filter(q => q.eq(q.field("isTyping"), true))
            .collect();

        const now = Date.now();
        const validTyping = typingDocs.filter(d =>
            d.userId !== user._id &&
            now - d.updatedAt < 5000
        );

        const typingUsers = await Promise.all(
            validTyping.map(async (d) => {
                return await ctx.db.get(d.userId);
            })
        );

        return typingUsers.filter(u => u !== null);
    }
});
