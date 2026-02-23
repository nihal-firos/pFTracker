interface AppPlaceholderPageProps {
  title: string;
  description: string;
}

export function AppPlaceholderPage({ title, description }: AppPlaceholderPageProps): JSX.Element {
  return (
    <main className="mx-auto w-full max-w-6xl animate-fade-in-up px-4 py-6 md:px-8 md:py-8">
      <section className="rounded-2xl border border-border/80 bg-card/80 p-8 shadow-2xl shadow-black/25 backdrop-blur-lg">
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
      </section>
    </main>
  );
}