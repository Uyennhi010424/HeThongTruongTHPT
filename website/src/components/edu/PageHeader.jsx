export default function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-lg flex flex-col items-end justify-between gap-md sm:flex-row sm:items-start">
      <div className="self-start">
        {title && (
          <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight">{title}</h2>
        )}
        {description && (
          <p className="mt-xs font-body-md text-body-md text-on-surface-variant">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-md sm:self-start">{actions}</div>}
    </div>
  );
}
