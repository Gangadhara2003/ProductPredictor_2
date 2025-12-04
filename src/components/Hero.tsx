import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Clock, Shield, TrendingUp } from "lucide-react";
import { jsPDF } from "jspdf";

const Hero = () => {
  const downloadSampleReport = () => {
    const doc = new jsPDF();

    const projectSizeSqft = 1200;
    const title = "Sample Construction Estimate Report";
    const subtitle = `Project Size: ${projectSizeSqft} sqft`;
    const date = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.text(subtitle, 14, 28);
    doc.text(`Date: ${date}`, 14, 36);

    doc.setDrawColor(150);
    doc.line(14, 40, 196, 40);

    doc.setFontSize(14);
    doc.text("Summary", 14, 52);
    doc.setFontSize(11);
    doc.text("- Estimated Total Cost Range: ₹9,60,000 - ₹12,80,000", 20, 60);
    doc.text("- Confidence Level: 85%", 20, 68);

    doc.setFontSize(14);
    doc.text("Materials BOQ (Sample)", 14, 84);
    doc.setFontSize(11);
    const materials = [
      { category: "Cement", qty: 350, unit: "bags", priceLow: 135000, priceHigh: 155000 },
      { category: "Steel", qty: 3.2, unit: "tons", priceLow: 192000, priceHigh: 224000 },
      { category: "Sand", qty: 24, unit: "cubic m", priceLow: 72000, priceHigh: 96000 },
      { category: "Bricks", qty: 18000, unit: "units", priceLow: 144000, priceHigh: 180000 },
      { category: "Aggregate", qty: 30, unit: "cubic m", priceLow: 105000, priceHigh: 135000 },
    ];

    let y = 92;
    materials.forEach((m) => {
      const line = `${m.category} — ${m.qty} ${m.unit} — ₹${m.priceLow.toLocaleString("en-IN")} - ₹${m.priceHigh.toLocaleString("en-IN")}`;
      doc.text(line, 20, y);
      y += 8;
    });

    doc.setFontSize(14);
    doc.text("Notes", 14, y + 12);
    doc.setFontSize(11);
    doc.text("- This is a sample report for demonstration purposes.", 20, y + 20);
    doc.text("- Prices are indicative and may vary by location and quality.", 20, y + 28);

    doc.save(`sample-estimate-${projectSizeSqft}sqft.pdf`);
  };
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center gradient-surface px-4 py-20">
      {/* Hero Content */}
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Badge */}
        <Badge variant="secondary" className="px-6 py-2 text-sm font-medium">
          <Shield className="w-4 h-4 mr-2" />
          Trusted by 10,000+ builders across India
        </Badge>

        {/* Heading */}
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Vcniti Building Material Predictor
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold text-primary">
            Estimate materials & cost in{" "}
            <span className="gradient-hero bg-clip-text text-transparent">
              60 seconds
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            AI-powered Q-commerce platform transforming construction material sourcing. 
            Get accurate BOQ and pricing with brand recommendations, eco-friendly alternatives, and instant supplier connections.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            variant="hero" 
            size="xl" 
            className="w-full sm:w-auto"
            onClick={() => {
              const predictorSection = document.getElementById('predictor');
              predictorSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Calculator className="w-5 h-5 mr-2" />
            Start Free Estimate
          </Button>
          <Button variant="outline" size="xl" className="w-full sm:w-auto" onClick={downloadSampleReport}>
            <Clock className="w-5 h-5 mr-2" />
            View Sample Report
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <Card className="p-6 shadow-card hover:shadow-accent transition-smooth">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">92%</div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </div>
          </Card>
          <Card className="p-6 shadow-card hover:shadow-accent transition-smooth">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">₹2.5L</div>
              <div className="text-sm text-muted-foreground">Avg. Savings</div>
            </div>
          </Card>
          <Card className="p-6 shadow-card hover:shadow-accent transition-smooth">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">24hrs</div>
              <div className="text-sm text-muted-foreground">Fresh Pricing</div>
            </div>
          </Card>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto gradient-hero rounded-full flex items-center justify-center text-white font-bold text-xl">
              1
            </div>
            <h3 className="text-lg font-semibold">Input Project Details</h3>
            <p className="text-muted-foreground">Share your project size, type, and quality preferences</p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto gradient-accent rounded-full flex items-center justify-center text-white font-bold text-xl">
              2
            </div>
            <h3 className="text-lg font-semibold">Get Instant BOQ</h3>
            <p className="text-muted-foreground">AI generates detailed material quantities and cost ranges</p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-accent rounded-full flex items-center justify-center text-white font-bold text-xl">
              3
            </div>
            <h3 className="text-lg font-semibold">Compare & Procure</h3>
            <p className="text-muted-foreground">View scenarios, find suppliers, and add to cart</p>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-pulse-glow">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-bounce-subtle"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;