'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

export default function HeroSection() {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'hero'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().imageUrl) {
        setHeroImage(docSnap.data().imageUrl);
      } else {
        setHeroImage(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <section className="relative bg-ocean text-white py-24 md:py-32 px-4 text-center overflow-hidden flex flex-col justify-center min-h-[50vh] xl:min-h-[60vh]">
      {heroImage && (
        <div className="absolute inset-0 z-0 bg-ocean">
          <Image 
            src={heroImage} 
            alt="Gena Modas Banner" 
            fill 
            className="object-cover opacity-60 mix-blend-overlay"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ocean/90 via-ocean/30 to-transparent"></div>
        </div>
      )}
      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="font-bold text-4xl md:text-5xl lg:text-7xl mb-6 text-gold font-serif tracking-wider drop-shadow-md">
          Bem-vinda à Gena Modas | Búzios
        </h1>
        <p className="text-xl md:text-3xl text-gray-200 mb-8 font-light tracking-wide drop-shadow">
          Seu estilo na palma da mão ✨
        </p>
      </div>
    </section>
  );
}
