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
        participantIds: v.array(v.id("users")),
        lastMessageId: v.optional(v.id("messages")),
        updatedAt: v.number(),
    }).index("by_participant_and_updated", ["participantIds", "updatedAt"]), // Basic index, we might need custom logic to find conversations by user

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
