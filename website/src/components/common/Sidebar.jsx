import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ links, title, isOpen = false, onClose }) {
  const { pathname } = useLocation();

  return (
    <aside className={`sidebar sidebar-collapsible ${isOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-badge">HT</div>
        <h3 className="sidebar-title">{title}</h3>
      </div>
      <nav>
        <ul className="sidebar-list">
          {links.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.path} className="sidebar-item">
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                >
                  <span className="sidebar-icon" />
                  <span className="sidebar-label">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}