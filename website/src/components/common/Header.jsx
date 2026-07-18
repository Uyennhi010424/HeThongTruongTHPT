export default function Header({ title }) {
  return (
    <header className="page-header">
      <div className="page-header-badge" aria-hidden="true">
        <span className="material-symbols-outlined">school</span>
      </div>
      <div>
        <p className="page-header-kicker">EduManager Pro</p>
        <h2 className="page-header-title">{title}</h2>
      </div>
    </header>
  );
}