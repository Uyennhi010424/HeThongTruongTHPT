import { useEffect, useState } from "react";

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

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    let counter = 0;
    const handler = (e) => {
      const { type = "info", message = "" } = e.detail || {};
      const id = `${Date.now()}-${++counter}`;
      setToasts((t) => [...t, { id, type, message }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    };
    window.addEventListener("httt_notify", handler);
    return () => window.removeEventListener("httt_notify", handler);
  }, []);

  const handleClose = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  if (!toasts.length) return null;

  return (
    <div className="httt-toast-container" aria-live="polite">
      {toasts.map((it) => (
        <ToastItem key={it.id} id={it.id} type={it.type} message={it.message} onClose={handleClose} />
      ))}
    </div>
  );
}
