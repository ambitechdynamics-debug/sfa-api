const Workspace = () => {
  const [chips, setChips] = React.useState(["Conception hi-fi", "Prototype interactif", "Système de conception (système de conception)"]);
  const [text, setText] = React.useState("");

  const removeChip = (c) => setChips(chips.filter(x => x !== c));

  return (
    <div className="h-screen flex flex-col bg-white text-[#2d2a26]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* TOP BAR */}
      <header className="h-12 shrink-0 border-b border-[#ECE8E1] flex items-center px-4 gap-4">
        <div className="flex items-center gap-2 w-[260px]">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F2C9B5 0%, #E0A48A 100%)" }}>
            <PaletteIcon size={13} className="text-[#5a3927]" />
          </div>
          <span className="text-[13.5px] font-medium" style={{ fontFamily: "'Source Serif 4', serif" }}>Consilium Design</span>
          <button className="ml-auto text-[#8a827a] hover:text-[#2d2a26]">
            <BellIcon size={15} />
          </button>
        </div>

        <div className="flex-1 flex items-end h-full pl-2">
          <div className="flex items-center gap-1.5 px-3 h-9 border-l border-t border-r border-[#ECE8E1] rounded-t-md bg-white text-[12.5px] font-medium relative" style={{ marginBottom: "-1px" }}>
            <FileIcon size={12} />
            Fichiers de conception
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-3.5 h-8 rounded-md bg-[#2d2a26] text-white text-[12.5px] font-medium hover:bg-[#1d1a16]">Partager</button>
          <div className="w-8 h-8 rounded-full bg-[#F2EEE7] text-[11.5px] font-semibold flex items-center justify-center text-[#6d6660]">AD</div>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL */}
        <aside className="w-[470px] shrink-0 flex flex-col border-r border-[#ECE8E1]">
          <div className="flex-1 flex flex-col items-center justify-start pt-[18%] px-10">
            <h1 className="text-[24px] tracking-tight mb-2" style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 500 }}>
              Commencez par le contexte
            </h1>
            <p className="text-[12.5px] text-[#8a827a] mb-7">Les designs ancrés dans un contexte réel sont meilleurs.</p>

            <div className="flex flex-col gap-2.5 w-[230px]">
              <ContextCard icon={<ClipboardIcon size={14} />} bg="#E89376" iconColor="white" label="Système de conception" />
              <ContextCard icon={<ImagePlusIcon />} bg="#5C7A4F" iconColor="white" label="Ajouter une capture d'écran" />
              <ContextCard icon={<CodeIcon />} bg="#4D6B8F" iconColor="white" label="Attacher une base de code" />
              <ContextCard icon={<FigmaGlyph />} bg="#8B4A6B" iconColor="white" label="Glisser un fichier Figma" help />
            </div>
          </div>

          {/* CHAT INPUT */}
          <div className="m-4 mb-5 rounded-xl border border-[#E5E0D7] bg-white p-3 shadow-sm">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Décrivez ce que vous voulez créer…"
              className="w-full h-16 text-[13px] placeholder:text-[#a8a098] focus:outline-none resize-none"
            />
            <div className="flex flex-wrap gap-1.5 pt-2">
              {chips.map(c => (
                <button key={c} onClick={() => removeChip(c)} className="text-[11.5px] px-2 py-[3px] rounded-md border border-[#E5E0D7] text-[#6d6660] flex items-center gap-1 hover:bg-[#FAF8F4]">
                  {c}
                  <XIcon size={9} />
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2.5 mt-1">
              <div className="flex items-center gap-1 text-[#8a827a]">
                <IconBtn><PlusIcon size={13} /></IconBtn>
                <IconBtn><SettingsIcon size={13} /></IconBtn>
                <IconBtn><AudioIcon size={13} /></IconBtn>
              </div>
              <button className="h-8 px-3.5 rounded-md text-white text-[12.5px] font-medium flex items-center gap-1.5" style={{ background: "#E89376" }}>
                <SendIcon size={11} />
                Envoyer
              </button>
            </div>
          </div>
        </aside>

        {/* CANVAS */}
        <section className="flex-1 flex flex-col relative bg-white overflow-hidden">
          {/* Sub toolbar */}
          <div className="h-10 shrink-0 flex items-center justify-between px-5 border-b border-[#ECE8E1]">
            <div className="flex items-center gap-3 text-[#6d6660]">
              <IconBtn><ArrowUp size={13} /></IconBtn>
              <IconBtn><RefreshIcon size={13} /></IconBtn>
              <span className="text-[12.5px] text-[#2d2a26] ml-1">Projet</span>
            </div>
            <div className="flex items-center gap-4 text-[12.5px] text-[#6d6660]">
              <button className="flex items-center gap-1.5 hover:text-[#2d2a26]">
                <PaperclipIcon size={12} />
                Nouveau sketch
              </button>
              <button className="flex items-center gap-1.5 hover:text-[#2d2a26]">
                <ClipboardIcon size={12} />
                Pâte
              </button>
            </div>
          </div>

          {/* Dotted grid canvas */}
          <div className="flex-1 relative" style={{
            backgroundImage: "radial-gradient(circle, #D8D2C8 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            backgroundPosition: "0 0"
          }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="text-[20px] text-[#8a827a]" style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 400 }}>
                Les créations apparaîtront ici
              </div>
              <button className="px-4 h-9 rounded-lg bg-white border border-[#E5E0D7] text-[12.5px] font-medium flex items-center gap-2 hover:bg-[#FAF8F4] shadow-sm">
                <PaperclipIcon size={12} />
                Commencez par un croquis
              </button>
            </div>

            {/* Bottom hint */}
            <div className="absolute left-0 right-0 bottom-0 px-5 py-3 text-[11.5px] text-[#8a827a] border-t border-[#ECE8E1] bg-white/60 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 font-semibold tracking-wider uppercase text-[10.5px] mb-0.5">
                <UploadIcon size={11} />
                Déposer des fichiers ici
              </div>
              <div>Images, documents, références, liens Figma ou dossiers — Claude les utilisera comme contexte.</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const IconBtn = ({ children }) => (
  <button className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#F2EEE7] text-[#6d6660]">{children}</button>
);

const ContextCard = ({ icon, bg, iconColor, label, help }) => (
  <button className="bg-white border border-[#E5E0D7] rounded-xl px-3 py-2.5 flex items-center gap-2.5 hover:shadow-sm transition-shadow text-left">
    <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: bg, color: iconColor }}>
      {icon}
    </div>
    <span className="text-[12.5px] font-medium flex-1 leading-tight">{label}</span>
    {help && <HelpIcon size={13} className="text-[#a8a098]" />}
  </button>
);

const ImagePlusIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>
  </svg>
);

const CodeIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>
  </svg>
);

const FigmaGlyph = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.5 2A2.5 2.5 0 0 0 6 4.5 2.5 2.5 0 0 0 8.5 7H11V2H8.5Zm0 5A2.5 2.5 0 0 0 6 9.5a2.5 2.5 0 0 0 2.5 2.5H11V7H8.5Zm5-5v5H16a2.5 2.5 0 0 0 0-5h-2.5Zm0 5a2.5 2.5 0 0 0 0 5 2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 13.5 7Zm-5 5A2.5 2.5 0 0 0 6 14.5 2.5 2.5 0 0 0 8.5 17a2.5 2.5 0 0 0 2.5-2.5V12H8.5Zm0 5A2.5 2.5 0 0 0 6 19.5 2.5 2.5 0 0 0 8.5 22 2.5 2.5 0 0 0 11 19.5V17H8.5Z"/>
  </svg>
);

Object.assign(window, { Workspace });
