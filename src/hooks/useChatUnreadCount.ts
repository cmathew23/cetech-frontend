"use client";

import { getChatUnreadCount } from "@/lib/api/chat";
import { getToken } from "@/lib/auth";
import { getChatSocket } from "@/lib/chatSocket";
import { isNormalizedApiError } from "@/lib/apiClient";
import { useCallback, useEffect, useRef, useState } from "react";

export const CHAT_UNREAD_REFRESH_EVENT = "chat-unread-refresh";

export function requestChatUnreadRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHAT_UNREAD_REFRESH_EVENT));
}

type UseChatUnreadCountOptions = {
  enabled?: boolean;
  clearOnError?: boolean;
};

export function useChatUnreadCount(options: UseChatUnreadCountOptions = {}) {
  const { enabled = false, clearOnError = false } = options;
  const [unreadCount, setUnreadCount] = useState(0);
  const requestSeqRef = useRef(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!enabled) return;
    if (!getToken()) {
      setUnreadCount(0);
      return;
    }
    const seq = ++requestSeqRef.current;
    try {
      const count = await getChatUnreadCount();
      if (seq === requestSeqRef.current) {
        setUnreadCount(count);
      }
    } catch (error) {
      if (seq === requestSeqRef.current && clearOnError) {
        setUnreadCount(0);
      }
      if (
        isNormalizedApiError(error) &&
        (error.status === 0 || error.status === 401 || error.status === 403)
      ) {
        return;
      }
      if (process.env.NODE_ENV === "development") {
        console.debug("[ChatUnread] GET /api/chat/unread-count failed.", error);
      }
    }
  }, [clearOnError, enabled]);

  useEffect(() => {
    if (!enabled) {
      setUnreadCount(0);
      return;
    }

    void refreshUnreadCount();

    const handleRefresh = () => {
      void refreshUnreadCount();
    };

    window.addEventListener(CHAT_UNREAD_REFRESH_EVENT, handleRefresh);

    let socket: ReturnType<typeof getChatSocket> | null = null;
    const handleIncomingMessage = () => {
      requestChatUnreadRefresh();
    };

    try {
      if (!getToken()) {
        return () => {
          window.removeEventListener(CHAT_UNREAD_REFRESH_EVENT, handleRefresh);
        };
      }
      socket = getChatSocket();
      socket.on("chat:message", handleIncomingMessage);
      if (!socket.connected) {
        socket.connect();
      }
    } catch {
      // User may not be authenticated yet; badge stays at 0.
    }

    return () => {
      window.removeEventListener(CHAT_UNREAD_REFRESH_EVENT, handleRefresh);
      socket?.off("chat:message", handleIncomingMessage);
    };
  }, [enabled, refreshUnreadCount]);

  return { unreadCount, refreshUnreadCount };
}
