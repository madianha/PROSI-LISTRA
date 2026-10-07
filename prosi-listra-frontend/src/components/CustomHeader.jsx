export default function CustomHeader({ category = "", pageName = "", children, colorText = ""}) {
  return (
    <header className="bg-gradient-to-b from-[#4a0711] to-[#5A0C1A] px-6 py-12 text-center sm:py-14">
      {category && (
        <p className="font-serif text-sm font-bold uppercase tracking-[0.14em] text-[#d4af37]">
          {category}
        </p>
      )}
      {pageName && (
        <h1 className={`mt-4 font-serif text-4xl font-bold sm:text-5xl ${colorText}`}>
          {pageName}
        </h1>
      )}
      <div className="mx-auto mt-5 max-w-5xl space-y-4 text-lg leading-relaxed text-white/75 sm:text-xl">
        {children}
      </div>
    </header>
  );
}
