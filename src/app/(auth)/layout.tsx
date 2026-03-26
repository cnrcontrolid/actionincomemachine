export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-charcoal">
            Action Income Machine
          </h1>
          <p className="text-warmgray mt-1 text-sm">90-day sales goal tracker</p>
        </div>
        {children}
      </div>
    </div>
  );
}
