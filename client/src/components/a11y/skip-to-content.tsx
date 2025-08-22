export function SkipToContent() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] px-3 py-2 rounded bg-primary text-primary-foreground"
    >
      Aller au contenu principal
    </a>
  );
}
