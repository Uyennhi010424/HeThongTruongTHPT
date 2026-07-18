export default function SimpleModal({ open, title, children, onClose, width = 480 }) {
  if (!open) return null;
  const cardStyle = {
    width: `min(${width}px, calc(100vw - 32px))`,
    maxHeight: "calc(100vh - 32px)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  };

  const headerStyle = {
    padding: "16px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    background: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 2
  };

  const bodyStyle = {
    padding: "16px",
    overflowY: "auto",
    // subtract header height (approx 64px) from available modal height
    maxHeight: "calc(100vh - 32px - 64px)"
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000
      }}
      onClick={onClose}
    >
      <div className="card" style={{ ...cardStyle, zIndex: 2001 }} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: "18px", color: "var(--navy-900)" }}>{title}</h3>
        </div>
        <div style={bodyStyle}>{children}</div>
      </div>
    </div>
  );
}