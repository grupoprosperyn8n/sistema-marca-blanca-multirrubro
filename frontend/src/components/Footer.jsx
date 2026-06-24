export default function Footer() {
  return (
    <footer className="bg-terra-900 text-terra-300 text-xs py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p>© {new Date().getFullYear()} — Sistema Marca Blanca Multirrubro (Fase 1A)</p>
        <p className="opacity-50 mt-1">Versión de desarrollo | Solo lectura</p>
      </div>
    </footer>
  );
}
