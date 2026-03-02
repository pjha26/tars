import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useOnlineStatus() {
    const updateActivity = useMutation(api.users.updateActivity);
    const setOffline = useMutation(api.users.setOffline);

    useEffect(() => {
        // Initial activity ping
        updateActivity().catch(console.error);

        // Ping every 1 minute
        const intervalId = setInterval(() => {
            if (document.visibilityState === "visible") {
                updateActivity().catch(console.error);
            }
        }, 60000);

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                updateActivity().catch(console.error);
            } else {
                setOffline().catch(console.error);
            }
        };

        const handleBeforeUnload = () => {
            // Beacon or best effort locally
            setOffline().catch(console.error);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [updateActivity, setOffline]);
}
