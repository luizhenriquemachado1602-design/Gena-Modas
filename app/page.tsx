import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductList from '@/components/ProductList';
import SeedDatabase from '@/components/SeedDatabase';
import PromoSection from '@/components/PromoSection';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-ocean text-white py-20 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-bold text-4xl md:text-5xl mb-6 text-gold font-serif">Coleção Sunset 2026</h2>
            <p className="text-lg md:text-xl text-gray-300 mb-8">
              Descubra a sofisticação praiana com peças exclusivas que capturam a essência de Armação de Búzios.
            </p>
          </div>
        </section>

        {/* Promo Section */}
        <PromoSection />

        {/* Vitrine */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="font-bold text-3xl text-ocean font-serif">Nossa Vitrine</h2>
              <p className="text-gray-500 mt-2">As peças mais desejadas da estação</p>
            </div>
            <SeedDatabase />
          </div>
          
          <ProductList />
        </section>
      </main>

      <Footer />
    </div>
  );
}
