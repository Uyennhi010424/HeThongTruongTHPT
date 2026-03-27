export default function SimpleModal({ open, title, children, onClose, width = 480 }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: `min(${width}px, calc(100vw - 32px))`, maxHeight: "calc(100vh - 32px)", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        <div>{children}</div>
      </div>
    </div>
  );
}