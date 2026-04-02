import { ShoppingBag, Menu } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-ocean">
          <ShoppingBag className="h-6 w-6" />
          <div>
            <h1 className="font-bold text-xl tracking-widest leading-none">GENA MODAS</h1>
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Armação de Búzios</span>
          </div>
        </div>
        <button className="p-2 text-ocean hover:bg-peach/20 rounded-full transition-colors">
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}
