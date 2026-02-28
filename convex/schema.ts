import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        imageUrl: v.optional(v.string()),
        isOnline: v.boolean(),
        lastSeen: v.number(),
    }).index("by_clerkId", ["clerkId"]),

    conversations: defineTable({
        isGroup: v.optional(v.boolean()),
        name: v.optional(v.string()), // For group chats
        lastMessageId: v.optional(v.id("messages")),
        updatedAt: v.number(),
    }),

    conversationMembers: defineTable({
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        hasReadLastMessage: v.optional(v.boolean()),
    })
        .index("by_userId", ["userId"])
        .index("by_conversationId", ["conversationId"])
        .index("by_conversation_and_user", ["conversationId", "userId"]),

    messages: defineTable({
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        content: v.string(),
        isDeleted: v.boolean(),
        reactions: v.optional(
            v.array(
                v.object({
                    emoji: v.string(),
                    userIds: v.array(v.id("users")),
                })
            )
        ),
    })
        .index("by_conversationId", ["conversationId"]),

    typingIndicators: defineTable({
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        isTyping: v.boolean(),
        updatedAt: v.number(),
    }).index("by_conversation_and_user", ["conversationId", "userId"]),

    unreadCounts: defineTable({
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        count: v.number(),
    }).index("by_conversation_and_user", ["conversationId", "userId"]),
});
