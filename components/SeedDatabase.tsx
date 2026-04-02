'use client';

import { useState } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RefreshCw } from 'lucide-react';

const INITIAL_PRODUCTS = [
  {
    name: "Vestido Seda Búzios",
    description: "Leveza e luxo para suas noites na Orla Bardot. Tecido fluido com caimento perfeito.",
    price: 289.90,
    imageUrl: "https://picsum.photos/seed/vestidoseda/400/500",
    reactions: {}
  },
  {
    name: "Conjunto Linho Geribá",
    description: "Elegância despojada para os dias de sol. Short e cropped em linho puro.",
    price: 349.90,
    imageUrl: "https://picsum.photos/seed/linhogeriba/400/500",
    reactions: {}
  },
  {
    name: "Saída de Praia Macramê",
    description: "Trabalho artesanal exclusivo. O toque boho chic que seu verão pede.",
    price: 199.90,
    imageUrl: "https://picsum.photos/seed/macrame/400/500",
    reactions: {}
  },
  {
    name: "Biquíni Asa Delta Ferradura",
    description: "Modelagem trend 2026 que valoriza a silhueta. Tecido texturizado premium.",
    price: 159.90,
    imageUrl: "https://picsum.photos/seed/biquini/400/500",
    reactions: {}
  },
  {
    name: "Chapéu Paris Aba Larga",
    description: "Proteção com muito estilo. Palha natural com fita personalizada.",
    price: 129.90,
    imageUrl: "https://picsum.photos/seed/chapeu/400/500",
    reactions: {}
  },
  {
    name: "Bolsa Palha Tartaruga",
    description: "O acessório indispensável para carregar o essencial com charme.",
    price: 219.90,
    imageUrl: "https://picsum.photos/seed/bolsa/400/500",
    reactions: {}
  }
];

export default function SeedDatabase() {
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      if (querySnapshot.empty) {
        for (const product of INITIAL_PRODUCTS) {
          await addDoc(collection(db, 'products'), product);
        }
        alert('Produtos adicionados com sucesso!');
      } else {
        alert('O banco de dados já possui produtos.');
      }
    } catch (error) {
      console.error("Error seeding database:", error);
      alert('Erro ao adicionar produtos.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <button 
      onClick={handleSeed}
      disabled={isSeeding}
      className="flex items-center gap-2 text-xs text-ocean hover:text-gold transition-colors"
      title="Adicionar produtos de teste"
    >
      <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">Gerar Produtos</span>
    </button>
  );
}
