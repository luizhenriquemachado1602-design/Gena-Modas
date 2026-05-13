import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductList from '@/components/ProductList';
import SeedDatabase from '@/components/SeedDatabase';
import PromoSection from '@/components/PromoSection';
import HeroSection from '@/components/HeroSection';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <HeroSection />

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
