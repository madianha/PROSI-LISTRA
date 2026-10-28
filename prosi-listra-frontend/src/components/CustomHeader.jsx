export default function CustomHeader({ category = "", pageName = "", children, colorText = ""}) {
  return (
    <header className="bg-gradient-to-b from-[#3b0009] to-[#570b18] px-6 py-6 text-center sm:py-8">
      {category && (
        <p className="font-serif text-[10px] font-bold uppercase tracking-[0.14em] text-[#e2bf53]">
          {category}
        </p>
      )}
      {pageName && (
        <h1 className={`mx-auto mt-3 max-w-3xl font-serif text-2xl font-bold leading-tight sm:text-3xl ${colorText}`}>
          {pageName}
        </h1>
      )}
      <div className="mx-auto mt-2 max-w-5xl space-y-2 text-xs leading-relaxed text-white/75 sm:text-sm">
        {children}
      </div>
    </header>
  );
}
