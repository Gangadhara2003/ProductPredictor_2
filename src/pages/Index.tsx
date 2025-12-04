import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import PredictorForm from "@/components/PredictorForm";
import ResultsDashboard from "@/components/ResultsDashboard";

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'results'>('home');

  // Simple hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'results') {
        setCurrentView('results');
      } else {
        setCurrentView('home');
      }
    };

    handleHashChange(); // Check initial hash
    window.addEventListener('hashchange', handleHashChange);
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (currentView === 'results') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1">
          <ResultsDashboard />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        <Hero />
        <PredictorForm />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
