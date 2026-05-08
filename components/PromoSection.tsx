'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Tag } from 'lucide-react';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PromoProduct {
  id: string;
  name: string;
  description: string;
  oldPrice?: number;
  price: number;
  imageUrl?: string;
  imageUrls?: string[];
}

export default function PromoSection() {
  const [promoProducts, setPromoProducts] = useState<PromoProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), where('isPromo', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData: PromoProduct[] = [];
      snapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() } as PromoProduct);
      });
      setPromoProducts(productsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching promo products:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading || promoProducts.length === 0) {
    return null; // Oculta a seção se estiver carregando ou não houver promoções
  }

  return (
    <section className="bg-peach/10 py-16 border-y border-peach/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-10">
          <Tag className="text-gold w-8 h-8" />
          <h2 className="font-bold text-3xl text-ocean font-serif">Promoções da Semana</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {promoProducts.map((product) => {
            const whatsappMessage = encodeURIComponent(`Olá, quero aproveitar a oferta especial da peça ${product.name} por ${formatPrice(product.price)}!`);
            const whatsappUrl = `https://wa.me/5522998556724?text=${whatsappMessage}`;
            
            const imagesToShow = product.imageUrls && product.imageUrls.length > 0 
                ? product.imageUrls 
                : [product.imageUrl || 'https://picsum.photos/seed/fashion/400/500'];

            return (
              <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-peach/30 flex flex-col sm:flex-row">
                <div className="relative w-full sm:w-2/5 aspect-[3/4] sm:aspect-auto bg-gray-100 overflow-hidden">
                  {imagesToShow.length > 1 ? (
                    <div className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                      {imagesToShow.map((imgUrl, idx) => (
                        <div key={idx} className="relative min-w-full h-full snap-start">
                          <Image 
                            src={imgUrl} 
                            alt={`${product.name} - Gena Modas Búzios${imagesToShow.length > 1 ? ` - Imagem ${idx + 1}` : ''}`}
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Image 
                      src={imagesToShow[0]} 
                      alt={`${product.name} - Gena Modas Búzios`}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {imagesToShow.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                      {imagesToShow.map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-sm" />
                      ))}
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                    Oferta Especial
                  </div>
                </div>
                
                <div className="p-6 flex-grow flex flex-col justify-center">
                  <h3 className="font-bold text-xl text-ocean leading-tight font-serif mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                  
                  <div className="mb-6">
                    {product.oldPrice && (
                      <span className="text-gray-400 line-through text-sm mr-2">{formatPrice(product.oldPrice)}</span>
                    )}
                    <span className="font-bold text-2xl text-ocean">{formatPrice(product.price)}</span>
                  </div>
                  
                  <button
                    data-product-name={product.name}
                    onClick={(e) => {
                      e.preventDefault();
                      // Log click directly in Firestore
                      addDoc(collection(db, 'cliques_vitrine'), {
                        productId: product.id,
                        modelo_peca: product.name,
                        createdAt: serverTimestamp()
                      }).catch(console.error);

                      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="inline-block w-full bg-ocean hover:bg-ocean/90 text-white text-center font-bold py-3 rounded-xl transition-colors mt-auto"
                  >
                    COMPRAR AGORA
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
