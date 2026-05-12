import ImageUpload from "./components/ImageUpload";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-20 -top-16 h-60 w-60 rounded-full bg-emerald-400/25 blur-3xl animate-[float_7s_ease-in-out_infinite]" />
        <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl animate-[float_9s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-14">
        <header className="flex flex-col gap-4 animate-[fade-in_0.6s_ease-out]">
          <span className="text-xs uppercase tracking-[0.4em] text-emerald-200/80">
            AI Research Demo
          </span>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">
            Rice Pest Detection System
          </h1>
          <p className="max-w-2xl text-base text-slate-300">
            Upload a rice leaf image to get an instant prediction from the
            ResNet50 model.
          </p>
        </header>

        <div className="animate-[fade-in_0.8s_ease-out]">
          <ImageUpload />
        </div>

        <section className="grid gap-4 text-sm text-slate-300 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
              Label
            </p>
            <p className="mt-2 text-base font-semibold text-white">
              {"S\u00e2u l\u1edbn"}
            </p>
            <p className="text-xs text-slate-400">pest-big</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
              Label
            </p>
            <p className="mt-2 text-base font-semibold text-white">
              {"S\u00e2u tr\u00f2n"}
            </p>
            <p className="text-xs text-slate-400">round-pest</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
              Label
            </p>
            <p className="mt-2 text-base font-semibold text-white">
              {"S\u00e2u d\u00e0i"}
            </p>
            <p className="text-xs text-slate-400">thin_pest</p>
          </div>
        </section>
      </div>
    </div>
  );
}
