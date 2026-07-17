import Link from "next/link";

interface PlaceholderScreenProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function PlaceholderScreen({
  eyebrow,
  title,
  description,
}: PlaceholderScreenProps) {
  return (
    <main
      className="grid min-h-svh place-items-center bg-[#6a0e68] px-5 py-12 text-white"
    >
      <section
        className="w-full max-w-xl rounded-[2rem] bg-[#f8dfa6] p-7 text-[#241714] shadow-2xl sm:p-10"
      >
        <p
          className="text-xs font-black uppercase tracking-[0.14em] text-[#005747]"
        >
          {eyebrow}
        </p>

        <h1
          className="mt-4 text-4xl font-black leading-[0.95] tracking-[-0.05em] sm:text-5xl"
        >
          {title}
        </h1>

        <p
          className="mt-5 max-w-md text-base leading-7 text-black/60"
        >
          {description}
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#005747] px-6 font-bold text-white"
        >
          Back to Welcome
        </Link>
      </section>
    </main>
  );
}
