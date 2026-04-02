import { MapPin, Instagram, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ocean text-white py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h2 className="font-bold text-2xl mb-4 text-gold">GENA MODAS</h2>
          <p className="text-gray-300 text-sm">
            Sofisticação praiana, exclusividade e "Trend 2026". A sua boutique de luxo ao beachwear em Búzios.
          </p>
        </div>
        
        <div>
          <h3 className="font-bold text-lg mb-4 text-peach">Contato</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gold" />
              <a href="https://wa.me/5522998556724" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                +55 22 99855-6724
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-gold" />
              <a href="#" className="hover:text-white transition-colors">@genamodas</a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-4 text-peach">Endereço</h3>
          <a 
            href="https://maps.google.com/?q=Rua+do+Progresso,+116,+Cem+Braças,+Armação+de+Búzios,+RJ" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-start gap-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <MapPin className="h-5 w-5 text-gold shrink-0 mt-0.5" />
            <span>
              Rua do Progresso, nº 116<br />
              Cem Braças<br />
              Armação de Búzios, RJ
            </span>
          </a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-white/10 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Gena Modas. Todos os direitos reservados.
      </div>
    </footer>
  );
}
