export default function LoadingSpinner({ size = 'md', label }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-text-muted">
      <div
        className={`${sizes[size]} animate-spin rounded-full border-2 border-surface-border border-t-brand-600`}
      />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
