import React, { useEffect, useState, useRef, useCallback } from "react";
import { getAccessToken } from "../api";

const Notifications: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const maxReconnectAttempts = 3; // Reduced from 5
  const reconnectDelay = 5000;
  const hasConnectedRef = useRef(false); // Track if we've ever connected

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;
    if (reconnectAttemptRef.current >= maxReconnectAttempts) return;

    const token = getAccessToken();
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.host;
    const url = `${protocol}://${host}/ws/notifications/?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptRef.current = 0;
      hasConnectedRef.current = true;
    };

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.message || data.type === "notification") {
          setMessages((m) => [data.message || data, ...m].slice(0, 5));
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {};

    ws.onclose = (e) => {
      setIsConnected(false);
      wsRef.current = null;

      const shouldReconnect =
        e.code !== 1000 &&
        e.code !== 1001 &&
        reconnectAttemptRef.current < maxReconnectAttempts;

      if (shouldReconnect) {
        reconnectAttemptRef.current += 1;
        setTimeout(connectWebSocket, reconnectDelay);
      }
    };
  }, []);

  useEffect(() => {
    // Poll for token availability before first connect
    const pollId = setInterval(() => {
      if (getAccessToken()) {
        clearInterval(pollId);
        connectWebSocket();
      }
    }, 500);

    // Fallback: try once after 2s in case token arrives quickly
    const timeoutId = setTimeout(() => {
      clearInterval(pollId);
      connectWebSocket();
    }, 2000);

    return () => {
      clearInterval(pollId);
      clearTimeout(timeoutId);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, "Component unmounted");
      }
      wsRef.current = null;
    };
  }, [connectWebSocket]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Don't render anything if never connected and no messages
  if (!hasConnectedRef.current && messages.length === 0 && !isConnected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 max-w-[90vw] bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 space-y-2 z-50 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          Notifications
          {isConnected ? (
            <span
              className="w-2 h-2 rounded-full bg-green-500 animate-pulse"
              title="Connected"
            />
          ) : (
            <span
              className="w-2 h-2 rounded-full bg-red-500"
              title="Disconnected"
            />
          )}
        </h3>
        <button
          onClick={clearMessages}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Clear
        </button>
      </div>

      {!isConnected && messages.length === 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          Connecting to notifications...
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className="text-sm text-gray-900 dark:text-gray-100 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-teal-500 shadow-sm animate-in slide-in-from-right duration-300"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
