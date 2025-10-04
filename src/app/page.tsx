import Link from "next/link";

const highlights = [
  { title: "Analítica contextual", description: "Identifica patrones, embudos y errores con anotaciones ricas en contexto." },
  { title: "Timeline inteligente", description: "Filtra eventos por tipo, busca en vivo y salta al instante al momento clave." },
  { title: "Velocidades adaptables", description: "Revive sesiones a tu ritmo, desde la calma 0.5x hasta inspección 8x." },
];

export default function Home() {
  return (
    <section className="flex flex-col gap-12 text-white">
      <div className="flex flex-col gap-8 rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-8 shadow-[0_45px_120px_rgba(14,165,233,0.25)] backdrop-blur-2xl md:p-12">
        <div className="flex flex-col gap-5 md:max-w-2xl">
          <span className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/70">
            Replays con superpoderes
          </span>
          <h2 className="text-3xl font-semibold leading-tight md:text-5xl">
            Observa, aprende y mejora cada interacción de tus usuarios.
          </h2>
          <p className="text-lg text-white/80 md:text-xl">
            Spectra Player te da una visión cristalina de cada sesión. Analiza eventos, entiende decisiones y comunica hallazgos con una UI creada para product designers, QA y equipos de growth.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href="/sessions" className="pill-button">
            Explorar sesiones demo
          </Link>
          <Link href="/login" className="pill-button">
            Iniciar sesión
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {highlights.map((item) => (
          <article key={item.title} className="card-surface flex flex-col gap-3 p-6 text-white/90">
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <p className="text-sm leading-relaxed text-white/70">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
