"use client"

const testimonials = [
  {
    id: "left",
    quote:
      "Studio Flyer AI m’aide à créer des visuels propres pour mes promotions sans perdre du temps. Je peux tester plusieurs idées, changer les textes et améliorer mes affiches beaucoup plus vite.",
    name: "Kevin B.",
    role: "Gérant de boutique",
    position: "left",
  },
  {
    id: "center",
    quote:
      "Avant, je passais beaucoup de temps à expliquer mes idées à un graphiste. Avec Studio Flyer AI, je décris simplement le besoin et j’obtiens rapidement une direction visuelle claire pour mes affiches, mes flyers et mes publications.",
    name: "Prisca M.",
    role: "Responsable communication",
    position: "center",
  },
  {
    id: "right",
    quote:
      "La plateforme est pratique pour préparer des supports de communication professionnels. Les propositions sont rapides, claires et adaptées aux réseaux sociaux comme à l’impression.",
    name: "Mireille A.",
    role: "Entrepreneure",
    position: "right",
  },
]

export function TestimonialsSection() {
  const center = testimonials.find((item) => item.position === "center")
  const left = testimonials.find((item) => item.position === "left")
  const right = testimonials.find((item) => item.position === "right")

  return (
    <section className="relative overflow-hidden bg-[var(--bg-0)] px-6 py-28 text-[#fff7ef]">
      {/* Background radial glow and warm layout grids with standard section background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(233,134,90,0.08),transparent_40%)]" />
      <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,rgba(255,247,239,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,247,239,0.08)_1px,transparent_1px)] bg-[size:72px_72px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-[#fff7ef]/50">
            Voici ce que disent les utilisateurs à propos de Studio Flyer AI
          </p>

          <h2 className="mt-5 text-4xl font-semibold tracking-tight text-[#fff7ef] md:text-6xl">
            Ils créent mieux avec Studio Flyer AI
          </h2>
        </div>

        {/* Desktop Depth Cards (visible on lg screens, hidden on mobile) */}
        <div className="relative mx-auto mt-20 hidden min-h-[380px] max-w-6xl lg:block">
          {left && (
            <article className="absolute left-0 top-16 w-[38%] rounded-[28px] border border-[#e9865a]/10 bg-[#120b08]/60 p-6 opacity-45 shadow-[0_0_45px_rgba(233,134,90,0.08)] blur-[0.2px] transition-all duration-300 hover:opacity-75 hover:scale-[1.01]">
              <div className="rounded-2xl bg-[#1a100b]/70 p-6">
                <p className="line-clamp-4 text-sm leading-relaxed text-[#fff7ef]/52">
                  &ldquo;{left.quote}&rdquo;
                </p>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e9865a]/20 bg-[#e9865a]/10 text-sm font-semibold text-[#f3a071]">
                  KB
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#fff7ef]/75">
                    {left.name}
                  </p>
                  <p className="text-xs text-[#fff7ef]/38">{left.role}</p>
                </div>
              </div>
            </article>
          )}

          {right && (
            <article className="absolute right-0 top-16 w-[38%] rounded-[28px] border border-[#e9865a]/10 bg-[#120b08]/60 p-6 opacity-45 shadow-[0_0_45px_rgba(233,134,90,0.08)] blur-[0.2px] transition-all duration-300 hover:opacity-75 hover:scale-[1.01]">
              <div className="rounded-2xl bg-[#1a100b]/70 p-6">
                <p className="line-clamp-4 text-sm leading-relaxed text-[#fff7ef]/52">
                  &ldquo;{right.quote}&rdquo;
                </p>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e9865a]/20 bg-[#e9865a]/10 text-sm font-semibold text-[#f3a071]">
                  MA
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#fff7ef]/75">
                    {right.name}
                  </p>
                  <p className="text-xs text-[#fff7ef]/38">{right.role}</p>
                </div>
              </div>
            </article>
          )}

          {center && (
            <article className="relative z-10 mx-auto w-full max-w-[620px] rounded-[34px] border border-[#e9865a]/18 bg-[#100805] p-4 shadow-[0_0_80px_rgba(233,134,90,0.16)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_90px_rgba(233,134,90,0.22)] md:p-5">
              <div className="rounded-[26px] border border-[#fff7ef]/5 bg-[#1b120d] p-8 shadow-[inset_0_0_60px_rgba(255,247,239,0.025)] md:p-10">
                <p className="text-lg font-medium leading-relaxed text-[#fff7ef]/72 md:text-xl">
                  &ldquo;{center.quote}&rdquo;
                </p>
              </div>

              <div className="mt-8 flex items-center gap-4 px-4 pb-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#e9865a]/25 bg-[#e9865a]/12 text-lg font-semibold text-[#f3a071] shadow-[0_0_25px_rgba(233,134,90,0.16)]">
                  PM
                </div>

                <div>
                  <p className="text-lg font-semibold text-[#fff7ef]">
                    {center.name}
                  </p>
                  <p className="text-sm text-[#fff7ef]/45">{center.role}</p>
                </div>
              </div>
            </article>
          )}
        </div>

        {/* Mobile Vertical Layout (visible on smaller screens, hidden on lg) */}
        <div className="mt-16 grid gap-5 lg:hidden">
          {[center, left, right].filter((item): item is typeof testimonials[0] => !!item).map((item) => {
            const initials = item.name.split(" ").map(n => n[0]).join("")
            const isCenter = item.position === "center"
            return (
              <article
                key={item.id}
                className={`rounded-3xl border p-6 transition-all ${
                  isCenter
                    ? "border-[#e9865a]/25 bg-[#100805] shadow-[0_0_40px_rgba(233,134,90,0.1)]"
                    : "border-[#e9865a]/12 bg-[#120b08]/80"
                }`}
              >
                <p className={`leading-relaxed text-[#fff7ef]/70 ${isCenter ? "text-base font-medium" : "text-sm"}`}>
                  &ldquo;{item.quote}&rdquo;
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <div className={`flex items-center justify-center rounded-full border font-semibold ${
                    isCenter
                      ? "h-12 w-12 border-[#e9865a]/25 bg-[#e9865a]/12 text-sm text-[#f3a071]"
                      : "h-10 w-10 border-[#e9865a]/15 bg-[#e9865a]/5 text-xs text-[#f3a071]"
                  }`}>
                    {initials}
                  </div>
                  <div>
                    <p className={`font-semibold text-[#fff7ef] ${isCenter ? "text-sm" : "text-xs"}`}>{item.name}</p>
                    <p className="text-xs text-[#fff7ef]/45">{item.role}</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
