import { mutation } from "./_generated/server";

export const seedData = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Must be logged in to seed data");

        // Get current user
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser) throw new Error("Current user not found");

        // Check if already seeded
        const existingUsers = await ctx.db.query("users").collect();
        if (existingUsers.length > 3) {
            return "Data already seeded!";
        }

        // Create mock users
        const mockUsers = [
            { name: "Alice Johnson", email: "alice@example.com", imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice", isOnline: true, lastSeen: Date.now() },
            { name: "Bob Smith", email: "bob@example.com", imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob", isOnline: false, lastSeen: Date.now() - 3600000 },
            { name: "Charlie Brown", email: "charlie@example.com", imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie", isOnline: true, lastSeen: Date.now() },
            { name: "Diana Prince", email: "diana@example.com", imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Diana", isOnline: false, lastSeen: Date.now() - 7200000 },
            { name: "Ethan Hunt", email: "ethan@example.com", imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan", isOnline: true, lastSeen: Date.now() },
        ];

        const userIds = [];
        for (const mockUser of mockUsers) {
            const userId = await ctx.db.insert("users", {
                clerkId: `mock_${mockUser.email}`,
                ...mockUser,
            });
            userIds.push(userId);
        }

        // --- Conversation 1: Current user <-> Alice (with messages) ---
        const conv1Id = await ctx.db.insert("conversations", {
            isGroup: false,
            updatedAt: Date.now() - 60000,
        });
        await ctx.db.insert("conversationMembers", { conversationId: conv1Id, userId: currentUser._id, hasReadLastMessage: false });
        await ctx.db.insert("conversationMembers", { conversationId: conv1Id, userId: userIds[0], hasReadLastMessage: true });

        const conv1Messages = [
            { senderId: userIds[0], content: "Hey! Welcome to Tars Live Chat 👋", time: Date.now() - 3600000 },
            { senderId: currentUser._id, content: "Thanks Alice! This looks amazing.", time: Date.now() - 3500000 },
            { senderId: userIds[0], content: "Have you tried the emoji reactions yet? Try hovering over a message!", time: Date.now() - 3400000 },
            { senderId: currentUser._id, content: "Oh cool, let me try!", time: Date.now() - 3300000 },
            { senderId: userIds[0], content: "You can also delete your own messages by hovering and clicking the trash icon 🗑️", time: Date.now() - 3200000 },
            { senderId: currentUser._id, content: "That's awesome! Real-time updates too?", time: Date.now() - 3100000 },
            { senderId: userIds[0], content: "Yep! Everything updates instantly via Convex subscriptions. Try opening two browser windows! 🚀", time: Date.now() - 3000000 },
        ];

        let lastMsgId1;
        for (const msg of conv1Messages) {
            lastMsgId1 = await ctx.db.insert("messages", {
                conversationId: conv1Id,
                senderId: msg.senderId,
                content: msg.content,
                isDeleted: false,
                reactions: [],
            });
        }

        // Add a reaction to the last message
        await ctx.db.patch(lastMsgId1!, {
            reactions: [
                { emoji: "🚀", userIds: [currentUser._id] },
                { emoji: "❤️", userIds: [userIds[0], currentUser._id] },
            ],
        });

        await ctx.db.patch(conv1Id, { lastMessageId: lastMsgId1, updatedAt: Date.now() - 60000 });
        await ctx.db.insert("unreadCounts", { conversationId: conv1Id, userId: currentUser._id, count: 3 });

        // --- Conversation 2: Current user <-> Bob ---
        const conv2Id = await ctx.db.insert("conversations", {
            isGroup: false,
            updatedAt: Date.now() - 7200000,
        });
        await ctx.db.insert("conversationMembers", { conversationId: conv2Id, userId: currentUser._id, hasReadLastMessage: true });
        await ctx.db.insert("conversationMembers", { conversationId: conv2Id, userId: userIds[1], hasReadLastMessage: true });

        const conv2Messages = [
            { senderId: userIds[1], content: "Hey, are you coming to the meeting tomorrow?", time: Date.now() - 86400000 },
            { senderId: currentUser._id, content: "Yes! I'll be there at 10am.", time: Date.now() - 85000000 },
            { senderId: userIds[1], content: "Perfect, see you then! 🎯", time: Date.now() - 84000000 },
        ];

        let lastMsgId2;
        for (const msg of conv2Messages) {
            lastMsgId2 = await ctx.db.insert("messages", {
                conversationId: conv2Id,
                senderId: msg.senderId,
                content: msg.content,
                isDeleted: false,
            });
        }
        await ctx.db.patch(conv2Id, { lastMessageId: lastMsgId2, updatedAt: Date.now() - 7200000 });

        // --- Conversation 3: Current user <-> Charlie (with a deleted message) ---
        const conv3Id = await ctx.db.insert("conversations", {
            isGroup: false,
            updatedAt: Date.now() - 1800000,
        });
        await ctx.db.insert("conversationMembers", { conversationId: conv3Id, userId: currentUser._id, hasReadLastMessage: false });
        await ctx.db.insert("conversationMembers", { conversationId: conv3Id, userId: userIds[2], hasReadLastMessage: true });

        await ctx.db.insert("messages", {
            conversationId: conv3Id,
            senderId: userIds[2],
            content: "Check out this new feature!",
            isDeleted: false,
        });
        await ctx.db.insert("messages", {
            conversationId: conv3Id,
            senderId: currentUser._id,
            content: "",
            isDeleted: true, // Soft deleted message demo
        });
        const lastMsg3 = await ctx.db.insert("messages", {
            conversationId: conv3Id,
            senderId: userIds[2],
            content: "No worries! Let me send it again 😄",
            isDeleted: false,
            reactions: [{ emoji: "😂", userIds: [currentUser._id] }],
        });
        await ctx.db.patch(conv3Id, { lastMessageId: lastMsg3, updatedAt: Date.now() - 1800000 });
        await ctx.db.insert("unreadCounts", { conversationId: conv3Id, userId: currentUser._id, count: 1 });

        // --- Conversation 4: Group chat ---
        const groupId = await ctx.db.insert("conversations", {
            isGroup: true,
            name: "Team Tars 🚀",
            updatedAt: Date.now() - 300000,
        });
        await ctx.db.insert("conversationMembers", { conversationId: groupId, userId: currentUser._id, hasReadLastMessage: false });
        await ctx.db.insert("conversationMembers", { conversationId: groupId, userId: userIds[0], hasReadLastMessage: true });
        await ctx.db.insert("conversationMembers", { conversationId: groupId, userId: userIds[2], hasReadLastMessage: true });
        await ctx.db.insert("conversationMembers", { conversationId: groupId, userId: userIds[4], hasReadLastMessage: true });

        const groupMessages = [
            { senderId: userIds[0], content: "Welcome everyone to Team Tars! 🎉" },
            { senderId: userIds[2], content: "Excited to be here!" },
            { senderId: userIds[4], content: "Let's build something amazing together 💪" },
            { senderId: userIds[0], content: "First task: test all the chat features!" },
        ];

        let lastGroupMsg;
        for (const msg of groupMessages) {
            lastGroupMsg = await ctx.db.insert("messages", {
                conversationId: groupId,
                senderId: msg.senderId,
                content: msg.content,
                isDeleted: false,
            });
        }
        await ctx.db.patch(groupId, { lastMessageId: lastGroupMsg, updatedAt: Date.now() - 300000 });
        await ctx.db.insert("unreadCounts", { conversationId: groupId, userId: currentUser._id, count: 4 });

        return "Mock data seeded successfully! Refresh the page to see conversations.";
    },
});
