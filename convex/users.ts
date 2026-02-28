import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const storeUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called storeUser without authentication present");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (user !== null) {
            // If we've seen this identity before but the name has changed, update the name.
            if (
                user.name !== identity.name ||
                user.imageUrl !== identity.pictureUrl
            ) {
                await ctx.db.patch(user._id, {
                    name: identity.name ?? "Anonymous",
                    imageUrl: identity.pictureUrl,
                    isOnline: true,
                    lastSeen: Date.now(),
                });
            }
            return user._id;
        }
        // If it's a new identity, create a new `User`.
        return await ctx.db.insert("users", {
            clerkId: identity.subject,
            name: identity.name ?? "Anonymous",
            email: identity.email ?? "",
            imageUrl: identity.pictureUrl,
            isOnline: true,
            lastSeen: Date.now(),
        });
    },
});

export const currentUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }
        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
    },
});

export const updateActivity = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (user) {
            await ctx.db.patch(user._id, {
                isOnline: true,
                lastSeen: Date.now(),
            });
        }
    },
});

export const setOffline = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (user) {
            await ctx.db.patch(user._id, {
                isOnline: false,
                lastSeen: Date.now(),
            });
        }
    },
});

export const getUsers = query({
    args: {
        searchTerm: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return [];

        let users = await ctx.db.query("users").collect();

        // Filter out current user
        users = users.filter((u) => u._id !== currentUser._id);

        // If searchTerm is provided and not empty, filter by name
        if (args.searchTerm && args.searchTerm.trim() !== "") {
            const lowerSearch = args.searchTerm.toLowerCase();
            users = users.filter((u) => u.name.toLowerCase().includes(lowerSearch));
        }

        return users.sort((a, b) => {
            // sort online users first
            if (a.isOnline === b.isOnline) return a.name.localeCompare(b.name);
            return a.isOnline ? -1 : 1;
        });
    },
});
