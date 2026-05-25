const Dashboard = () => {
  const [activeTab, setActiveTab] = React.useState("Autres");
  const [topTab, setTopTab] = React.useState("Récent");

  const projects = [
    { title: "Découvrez Claude Design", subtitle: "Petit tutoriel", featured: true },
    { title: "SERVICES DE FIDUCIE", subtitle: "Votre design · Aujourd…", chip: "Propriétaire" },
    { title: "Refonte Flyer Studio", subtitle: "Votre design · Aujourd…", chip: "Propriétaire" },
    { title: "IMOGEST", subtitle: "Votre design · Aujourd…", chip: "Propriétaire" },
    { title: "CLIAISONPLUS", subtitle: "Votre design · Aujourd…", chip: "Propriétaire" },
    { title: "Animation Logo SVG Consilium", subtitle: "Votre design · Hier", chip: "Propriétaire" },
    { title: "IA des flyers de studio", subtitle: "Votre design · 9 mai", chip: "Propriétaire" },
    { title: "NZILA", subtitle: "Votre design · 8 mai", chip: "Propriétaire" },
    { title: "Système de conception", subtitle: "Votre design · 2 mai", chip: "Propriétaire", system: true },
  ];

  const tabs = ["Prototype", "Diaporama", "Extrait du modèle", "Autres"];
  const topTabs = ["Récent", "Vos créations", "Exemples", "Systèmes de conception"];

  return (
    <div className="flex h-screen bg-white text-[#2d2a26]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* SIDEBAR */}
      <aside className="w-[340px] shrink-0 border-r border-[#ECE8E1] flex flex-col">
        {/* Logo */}
        <div className="px-7 pt-7 pb-5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F2C9B5 0%, #E0A48A 100%)" }}>
            <PaletteIcon size={20} className="text-[#5a3927]" />
          </div>
          <div className="flex-1 pt-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[19px] tracking-tight" style={{ fontFamily: "'Source Serif 4', 'Tiempos', serif", fontWeight: 500 }}>Claude Design</span>
              <span className="text-[10.5px] px-2 py-[3px] rounded-md border border-[#E5E0D7] text-[#6d6660] font-medium whitespace-nowrap">Aperçu de la recherche</span>
            </div>
            <div className="text-[12px] text-[#8a827a] mt-0.5">par Anthropic Labs</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-7 flex gap-5 border-b border-[#ECE8E1] text-[13px]">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`pb-2.5 -mb-px border-b-2 transition-colors ${activeTab === t ? "border-[#2d2a26] text-[#2d2a26] font-medium" : "border-transparent text-[#8a827a] hover:text-[#2d2a26]"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="px-7 py-6 flex-1">
          <div className="text-[15px] font-semibold mb-3">Nouveau diapositive</div>
          <input placeholder="Nom du projet" className="w-full h-9 px-3 rounded-lg border border-[#E5E0D7] text-[13px] placeholder:text-[#a8a098] focus:outline-none focus:border-[#D2C9BC]" />

          <div className="text-[12.5px] text-[#6d6660] mt-5 mb-2">Système de conception</div>
          <button className="w-full h-12 px-3 rounded-lg border border-[#E5E0D7] flex items-center gap-3 hover:bg-[#FAF8F4]">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "#E8DDD0" }}>
              <FolderIcon size={16} color="#8a6f55" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[12.5px] font-medium leading-tight">Système de conception</div>
              <div className="text-[10.5px] text-[#8a827a] leading-tight mt-0.5">Par défaut</div>
            </div>
            <ChevronDown />
          </button>

          <button className="mt-4 w-full h-11 rounded-lg flex items-center justify-center gap-2 text-white text-[13.5px] font-medium" style={{ background: "#E89376" }}>
            <PlusIcon size={14} />
            Créer
          </button>

          <div className="text-[11.5px] text-[#8a827a] text-center mt-5">Toi seul peux voir ton projet par défaut.</div>
        </div>

        {/* Bottom user chips */}
        <div className="px-7 pb-6 flex flex-col gap-2">
          <button className="self-start text-[11.5px] px-2.5 py-1 rounded-full border border-[#E5E0D7] flex items-center gap-1.5 text-[#6d6660]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#a8a098]"></span>
            Docs
          </button>
          <button className="self-start text-[11.5px] px-2.5 py-1 rounded-full border border-[#E5E0D7] flex items-center gap-1.5 text-[#6d6660]">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#D2C9BC]"></span>
            ambitechdynamics@gmail.com's Organization
          </button>
          <button className="self-start text-[11.5px] px-2.5 py-1 rounded-full border border-[#E5E0D7] flex items-center gap-1.5 text-[#6d6660]">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>
            DYNAMIQUE AMBITECH
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-9 pt-7 pb-2">
          <nav className="flex items-end gap-7">
            {topTabs.map(t => (
              <button key={t} onClick={() => setTopTab(t)}
                className={`pb-2 -mb-px text-[14px] border-b-2 ${topTab === t ? "border-[#E89376] text-[#2d2a26] font-medium" : "border-transparent text-[#6d6660] hover:text-[#2d2a26]"}`}>
                {t}
              </button>
            ))}
          </nav>
          <div className="relative w-[260px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a098]" />
            <input placeholder="Chercher…" className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E5E0D7] text-[13px] placeholder:text-[#a8a098] focus:outline-none focus:border-[#D2C9BC]" />
          </div>
        </div>
        <div className="border-b border-[#ECE8E1]"></div>

        {/* Cards grid */}
        <div className="flex-1 overflow-auto px-9 py-7">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {projects.map((p, i) => (
              <ProjectCard key={i} {...p} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

const ProjectCard = ({ title, subtitle, chip, featured, system }) => {
  if (featured) {
    return (
      <div className="rounded-2xl overflow-hidden border border-[#ECE8E1] bg-white hover:shadow-sm transition-shadow group cursor-pointer">
        <div className="relative h-[140px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E3E7EE 0%, #D2D9E2 100%)" }}>
          <button className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/70 flex items-center justify-center text-[#6d6660] opacity-0 group-hover:opacity-100">
            <XIcon />
          </button>
          {/* Apple on book illustration */}
          <svg width="74" height="74" viewBox="0 0 100 100" fill="none">
            <ellipse cx="50" cy="78" rx="34" ry="3" fill="#000" opacity=".08"/>
            <path d="M14 70 L86 70 L86 78 L14 78 Z" fill="#fff" stroke="#8a827a" strokeWidth="1.2"/>
            <path d="M16 70 L16 64 L84 64 L84 70 Z" fill="#F2EFE9" stroke="#8a827a" strokeWidth="1.2"/>
            <path d="M50 22 C55 22 60 26 60 32 C66 30 72 34 72 42 C72 50 64 56 56 56 L44 56 C36 56 28 50 28 42 C28 34 34 30 40 32 C40 26 45 22 50 22 Z" fill="#A8C28A"/>
            <path d="M50 28 C52 28 54 30 54 32" stroke="#7a9c5e" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
            <path d="M52 22 C54 18 58 16 62 16 C61 20 58 23 54 24" fill="#7a9c5e"/>
          </svg>
        </div>
        <div className="p-3.5">
          <div className="text-[13px] font-semibold leading-tight">{title}</div>
          <div className="text-[12px] text-[#9c5a3d] mt-1">{subtitle}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-[#ECE8E1] bg-white hover:shadow-sm transition-shadow cursor-pointer">
      <div className="relative h-[140px] flex items-center justify-center" style={{ background: system ? "#F4E0D5" : "#DDD7CB" }}>
        {system && (
          <span className="absolute top-2.5 left-2.5 text-[10px] px-2 py-[3px] rounded-full text-[#9c5a3d]" style={{ background: "#F9C7B0" }}>
            Système de conception
          </span>
        )}
        <FolderIcon size={42} color={system ? "#C8A28E" : "#A89E8C"} />
      </div>
      <div className="p-3.5">
        <div className="text-[12.5px] font-semibold leading-tight truncate">{title}</div>
        <div className="flex items-center justify-between mt-1 gap-2">
          <div className="text-[11px] text-[#8a827a] truncate">{subtitle}</div>
          {chip && (
            <span className="shrink-0 text-[10px] px-1.5 py-[2px] rounded bg-[#F2EEE7] text-[#8a827a] border border-[#ECE8E1]">{chip}</span>
          )}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Dashboard });
