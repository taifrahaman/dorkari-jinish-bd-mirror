// src/app/admin/(auth)/layout.tsx

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-primary px-4 py-12">
      {/* dark gradient base */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-primary-dark to-black"
      />

      {/* amber glow top-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full bg-brand-accent/20 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
