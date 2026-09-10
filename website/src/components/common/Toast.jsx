import { useEffect, useRef, useState } from "react";

function ToastItem({ id, type, message, onClose }) {
  return (
    <div className={`httt-toast httt-toast-${type}`} role="status">
      <div className="httt-toast-icon" aria-hidden="true">
        <span className="material-symbols-outlined">
          {type === "success" ? "check_circle" : type === "error" ? "error" : "info"}
        </span>
      </div>
      <div className="httt-toast-message">{message}</div>
      <button className="httt-toast-close" onClick={() => onClose(id)}>×</button>
    </div>
  );
}

const MAX_TOASTS = 3;

export default function Toast() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = (id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  };

  useEffect(() => {
    let counter = 0;
    const handler = (e) => {
      const { type = "info", message = "" } = e.detail || {};

      // Dedup: nếu cùng message + type đang hiển thị thì bỏ qua
      setToasts((prev) => {
        const existing = prev.find((t) => t.message === message && t.type === type);
        if (existing) {
          // Reset timer của toast hiện tại
          if (timers.current[existing.id]) {
            clearTimeout(timers.current[existing.id]);
          }
          timers.current[existing.id] = setTimeout(() => {
            setToasts((t) => t.filter((x) => x.id !== existing.id));
            delete timers.current[existing.id];
          }, 3500);
          return prev;
        }

        const id = `${Date.now()}-${++counter}`;
        timers.current[id] = setTimeout(() => {
          setToasts((t) => t.filter((x) => x.id !== id));
          delete timers.current[id];
        }, 3500);

        // Giới hạn tối đa MAX_TOASTS toast cùng lúc
        const next = [...prev, { id, type, message }];
        return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
      });
    };
    window.addEventListener("httt_notify", handler);
    return () => window.removeEventListener("httt_notify", handler);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="httt-toast-container" aria-live="polite">
      {toasts.map((it) => (
        <ToastItem key={it.id} id={it.id} type={it.type} message={it.message} onClose={removeToast} />
      ))}
    </div>
  );
}
