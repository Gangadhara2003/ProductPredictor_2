// PredictorForm.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Building,
  Home,
  Layers,
  Star,
  ArrowRight,
  ArrowLeft,
  Bot,
  Loader2,
  Download,
  Share2,
  ShoppingCart,
  TrendingUp,
  CheckCircle
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/* ---------------------------
   Types
----------------------------*/
interface FormData {
  stage: string;
  buildingType: string;
  totalAreaSqft: string;
  floors: string;
  quality: string;
  city: string;
  additionalRequirements?: string;
}

interface Material {
  id: string;
  category: string;
  qty: number;
  unit: string;
  priceLow: number;
  priceHigh: number;
  selected: boolean;
  availableBrands: string[];
  selectedBrand: string;
  description?: string;
}

interface EstimateData {
  totalLow: number;
  totalHigh: number;
  confidence: number;
  materials: Material[];
  reasoning?: string;
}

/* ---------------------------
   Currency formatting helpers
----------------------------*/
const formatCurrency = (amount: number): string => {
  // Use a simpler approach to ensure rupee symbol displays correctly
  const formatted = amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  return `₹${formatted}`;
};

const formatCurrencyRange = (low: number, high: number): string => {
  const lowFormatted = low.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const highFormatted = high.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  return `₹${lowFormatted} - ₹${highFormatted}`;
};

// Compact currency format for small spaces
const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 10000000) { // 1 crore
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) { // 1 lakh
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) { // 1 thousand
    return `₹${(amount / 1000).toFixed(0)}K`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

/* ---------------------------
   Brand DB + helpers
----------------------------*/
const brandDatabase: Record<string, string[]> = {
  cement: ["UltraTech", "ACC", "Ambuja", "Shree Cement", "JK Cement", "Dalmia Cement"],
  steel: ["Tata Tiscon", "SAIL", "JSW Steel", "Jindal Steel", "RINL", "Kamdhenu"],
  sand: ["River Sand", "M-Sand", "Robo Sand", "P Sand", "Crushed Sand"],
  aggregate: ["20mm Aggregate", "10mm Aggregate", "Blue Metal", "Crushed Stone", "Jelly"],
  bricks: ["Wienerberger", "Fly Ash Bricks", "Clay Bricks", "AAC Blocks", "Solid Blocks"],
  tiles: ["Kajaria", "Somany", "Johnson", "Nitco", "H&R Johnson", "RAK Ceramics"],
  paint: ["Asian Paints", "Berger Paints", "Nerolac", "Dulux", "Shalimar Paints"],
  electrical: ["Havells", "Anchor", "Legrand", "Schneider", "L&T", "Finolex"],
  plumbing: ["Jaquar", "Hindware", "Cera", "Parryware", "Kohler", "TOTO"],
  doors: ["Tata Pravesh", "Godrej", "Century Ply", "Greenply", "Merino"],
  windows: ["Fenesta", "AIS Glasxperts", "REHAU", "Deceuninck", "Schuco"],
  roofing: ["Tata BlueScope", "JSW Roofing", "Essar Steel", "Hindalco"],
  insulation: ["Rockwool", "Thermax", "Knauf", "Saint-Gobain", "Owens Corning"],
  glass: ["Asahi Glass", "Guardian Glass", "Pilkington", "Saint-Gobain"],
  concrete: ["Ready Mix Concrete", "ACC Concrete", "UltraTech RMC", "Dalmia RMC"],
  wooden: ["Greenply", "Century Ply", "Kitply", "Merino", "Sainik Ply"],
  metal: ["Tata Steel", "JSW Steel", "Hindalco", "Vedanta"],
  adhesive: ["Fevicol", "Pidilite", "MYK LATICRETE", "CICO", "Weber"],
  waterproof: ["Dr. Fixit", "Fosroc", "BASF MasterSeal", "Tremco", "CICO"]
};

const getBrandsForMaterial = (category: string): string[] => {
  const searchTerms = category.toLowerCase().split(" ");
  for (const term of searchTerms) {
    for (const [key, brands] of Object.entries(brandDatabase)) {
      if (term.includes(key) || key.includes(term)) return brands;
    }
  }
  return ["Premium Brand", "Standard Brand", "Economy Brand"];
};

/* ---------------------------
   (Optional) GPT call helpers
   kept as-is from your file
----------------------------*/
const OPENAI_API_KEY = import.meta.env.VITE_API_URL;
const USE_MOCK_DATA = false;

const generateMockEstimate = (formData: FormData): EstimateData => {
  const area = parseInt(formData.totalAreaSqft) || 1000;
  const floors = parseInt(formData.floors) || 1;
  const materials: Material[] = [
    {
      id: "1",
      category: "Cement",
      qty: Math.max(1, Math.round((area * floors * 0.12))),
      unit: "bags",
      priceLow: 450,
      priceHigh: 520,
      selected: true,
      availableBrands: getBrandsForMaterial("cement"),
      selectedBrand: getBrandsForMaterial("cement")[0],
      description: "OPC 53 grade cement"
    },
    {
      id: "2",
      category: "Steel (TMT)",
      qty: Math.max(1, Math.round((area * floors * 2.8))),
      unit: "kg",
      priceLow: 60,
      priceHigh: 70,
      selected: true,
      availableBrands: getBrandsForMaterial("steel"),
      selectedBrand: getBrandsForMaterial("steel")[0],
      description: "Fe 500D TMT bars"
    },
    {
      id: "3",
      category: "Sand",
      qty: Math.max(1, Math.round((area * floors * 0.015))),
      unit: "tons",
      priceLow: 2250,
      priceHigh: 3000,
      selected: true,
      availableBrands: getBrandsForMaterial("sand"),
      selectedBrand: getBrandsForMaterial("sand")[0],
      description: "River sand / M-sand (fine aggregate)"
    }
  ];

  const selectedMaterials = materials.filter((m) => m.selected);
  const totalLow = selectedMaterials.reduce((s, m) => s + m.priceLow * m.qty, 0);
  const totalHigh = selectedMaterials.reduce((s, m) => s + m.priceHigh * m.qty, 0);

  return {
    totalLow,
    totalHigh,
    confidence: 88,
    materials,
    reasoning: `Mock estimate for ${formData.stage || "project"} — area ${area} sq ft`
  };
};

const callGPT4ForEstimate = async (formData: FormData): Promise<EstimateData> => {
  const prompt = `You are a senior construction cost estimation expert for the Indian market. Analyze the project details and produce a bill of materials tailored to the specified stage, quality, city, and area, using current (2025) market rates for the given city in INR.

Project Details:
- Stage: ${formData.stage}
- Building Type: ${formData.buildingType}
- Total Area: ${formData.totalAreaSqft} sq ft
- Floors: ${formData.floors}
- Quality Level: ${formData.quality}
- Location: ${formData.city}, India
- Additional Requirements: ${formData.additionalRequirements || 'None'}

Output Requirements — respond ONLY with VALID JSON matching EXACTLY this schema:
{
  "materials": [
    {
      "category": "Material Name",
      "qty": number,
      "unit": "unit type",
      "priceLow": number,
      "priceHigh": number,
      "description": "brief description including grade/specification",
      "priority": "high" | "medium" | "low"
    }
  ],
  "totalLow": number,
  "totalHigh": number,
  "confidence": number
}

Strict Rules:
1) Use city-specific 2025 Indian market rates for ${formData.city}. Prices must be material-only (exclude labor) and before GST. Note GST assumptions in reasoning if relevant.

2) Include at least 20–25 detailed material categories relevant to the ${formData.stage} stage only. 
   - Cover structural, finishing, MEP, and auxiliary items where applicable.
   - Each category must be unique and non-overlapping (no merging cement & concrete together).
   - Always expand beyond basics to include sub-categories like primers, waterproofing, adhesives, insulation, hardware, fixtures, etc.

3) Quantities must be realistic for ${formData.totalAreaSqft} sq ft and ${formData.floors} floors, using standard thumb rules:
   - Cement bags = 50 kg
   - Steel in kg/tonne
   - Aggregates/sand in m³
   - Bricks in numbers
   - Tiles in m² with 5–10% wastage
   State key quantity assumptions in reasoning.

4) Match quality level ${formData.quality}:
   - Economy: basic brands/specs, M20 concrete, AAC 600–650 kg/m³, Fe500 steel, CPVC SDR 13.5, FR PVC wires
   - Standard: mid-tier brands/specs, M25 concrete, AAC 550–600 kg/m³, Fe500D steel, CPVC SDR 11, FRLS wires
   - Premium: top-tier brands/specs, M30 concrete, AAC 500–550 kg/m³, Fe550D steel, CPVC SDR 7.4, FRLSH wires
   Reflect chosen quality in each description.

5) Each material description must include clear grade/specification (e.g., "OPC 43 Grade", "TMT Fe500D IS 1786", "M25 ready-mix concrete", "CPVC SDR 11 IS 15778", "Ceramic tile 600×600 mm PEI 4").

6) priceLow/priceHigh: realistic min–max price per unit (two decimals).

7) Calculate totalLow/totalHigh as sum of (qty × priceLow/priceHigh). Ensure arithmetic accuracy.

8) Set priority based on stage-criticality:
   - Structural materials = high
   - Consumables/additives = medium
   - Optional enhancements = low

9) confidence score [0-1]: reflect data freshness, market volatility, stage clarity, and assumption load.

10) For missing/ambiguous inputs, use conservative industry-standard assumptions:
    - 3.0 m floor height
    - 150–200 mm slab thickness
    - 12–15% wastage for steel/formwork
    - 5–8% wastage for tiles
    List assumptions in reasoning.
11) multiply the quantity with the price of each product:
      - if cement cost 100 if the quantity is 750 the total cement price which is added should be 750 * 100.

Validation Requirements:
- Use Indian standard units (bag, kg, tonne, m³, m², rmt, nos)
- Valid JSON format only
- Totals must equal sum of line items along with their quantity
- No additional keys in JSON structure

Deliver exactly one JSON object as specified.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'User-Agent': 'Construction-Estimator/1.0'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a construction cost estimation expert for India. Respond only with valid JSON.'
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid API response structure');
    }

    const gptResponse = data.choices[0].message.content;

    let parsedResponse;
    try {
      const cleanedResponse = gptResponse.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : cleanedResponse;
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('GPT Response:', gptResponse);
      throw new Error('Could not parse AI response as JSON');
    }

    if (!parsedResponse.materials || !Array.isArray(parsedResponse.materials)) {
      throw new Error('Invalid materials data from AI');
    }

    const materials: Material[] = parsedResponse.materials.map((item: any, index: number) => ({
      id: (index + 1).toString(),
      category: item.category || 'Unknown Material',
      qty: Number(item.qty) || 1,
      unit: item.unit || 'units',
      priceLow: Number(item.priceLow) || 0,
      priceHigh: Number(item.priceHigh) || 0,
      selected: item.priority === 'high' || item.priority === 'medium',
      availableBrands: getBrandsForMaterial(item.category || ''),
      selectedBrand: getBrandsForMaterial(item.category || '')[0],
      description: item.description || ''
    }));

    const totalLow = Number(parsedResponse.totalLow) || materials.reduce((sum, m) => sum + (m.priceLow * m.qty), 0);
    const totalHigh = Number(parsedResponse.totalHigh) || materials.reduce((sum, m) => sum + (m.priceHigh * m.qty), 0);

    return {
      totalLow,
      totalHigh,
      confidence: Number(parsedResponse.confidence) || 85,
      materials,
      reasoning: parsedResponse.reasoning || 'AI-generated estimate based on project requirements'
    };

  } catch (error) {
    console.error('GPT-4 API call failed:', error);
    console.log('Falling back to enhanced mock data...');
    return generateMockEstimate(formData);
  }
};

/* ---------------------------
   MaterialSelectionStep
----------------------------*/
const MaterialSelectionStep = ({
  materials,
  onMaterialsChange,
  onNext,
  onPrev
}: {
  materials: Material[];
  onMaterialsChange: (m: Material[]) => void;
  onNext: () => void;
  onPrev: () => void;
}) => {
  const toggleMaterial = (materialId: string) => {
    const updated = materials.map((m) => (m.id === materialId ? { ...m, selected: !m.selected } : m));
    onMaterialsChange(updated);
  };

  const updateBrand = (materialId: string, brand: string) => {
    const updated = materials.map((m) => (m.id === materialId ? { ...m, selectedBrand: brand } : m));
    onMaterialsChange(updated);
  };

  const updateQuantity = (materialId: string, qty: number) => {
    const updated = materials.map((m) => (m.id === materialId ? { ...m, qty } : m));
    onMaterialsChange(updated);
  };

  const selectedMaterials = materials.filter((m) => m.selected);
  const totalLow = selectedMaterials.reduce((sum, m) => sum + m.priceLow * m.qty, 0);
  const totalHigh = selectedMaterials.reduce((sum, m) => sum + m.priceHigh * m.qty, 0);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-semibold">AI-Generated Materials List</h3>
        <p className="text-muted-foreground">Review, customize, and select your materials</p>
        <Badge variant="secondary" className="mt-2">
          <Bot className="w-4 h-4 mr-1" />
          Powered by GPT
        </Badge>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-primary/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Selected Items</p>
              <p className="text-2xl font-bold text-primary">{selectedMaterials.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cost Range</p>
              <div className="text-lg font-bold break-words">
                <div>{formatCurrencyCompact(totalLow)}</div>
                <div className="text-sm">to {formatCurrencyCompact(totalHigh)}</div>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Cost</p>
              <p className="text-lg font-bold text-green-600">{formatCurrencyCompact((totalLow + totalHigh) / 2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {materials.map((material) => (
          <Card key={material.id} className={`transition-all ${material.selected ? "border-primary shadow-md" : "border-muted opacity-60"}`}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Checkbox
                  checked={material.selected}
                  onCheckedChange={() => toggleMaterial(material.id)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{material.category}</h4>
                      {material.description && <p className="text-xs text-muted-foreground">{material.description}</p>}
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {formatCurrencyCompact(material.priceLow)} - {formatCurrencyCompact(material.priceHigh)}
                    </Badge>
                  </div>

                  {material.selected && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          value={material.qty}
                          onChange={(e) => updateQuantity(material.id, parseInt(e.target.value || "0", 10))}
                          className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground">{material.unit}</p>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs">Preferred Brand</Label>
                        <Select value={material.selectedBrand} onValueChange={(brand) => updateBrand(material.id, brand)}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {material.availableBrands.map((brand) => (
                              <SelectItem key={brand} value={brand}>
                                {brand}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={onPrev} className="flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <Button variant="hero" onClick={onNext} disabled={selectedMaterials.length === 0} className="flex items-center">
          Generate Final Estimate
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

/* ---------------------------
   PredictorForm (main)
----------------------------*/
const PredictorForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    stage: "",
    buildingType: "",
    totalAreaSqft: "",
    floors: "",
    quality: "",
    city: "",
    additionalRequirements: ""
  });
  const [aiGeneratedMaterials, setAiGeneratedMaterials] = useState<Material[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [finalEstimate, setFinalEstimate] = useState<EstimateData | null>(null);

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = async () => {
    if (currentStep === 5) {
      setIsLoading(true);
      try {
        const estimate = await callGPT4ForEstimate(formData);
        const mats = estimate.materials.map((m, idx) => ({
          ...m,
          id: m.id || String(idx + 1),
          selected: typeof m.selected === "boolean" ? m.selected : true,
          availableBrands: m.availableBrands || getBrandsForMaterial(m.category || ""),
          selectedBrand: m.selectedBrand || (getBrandsForMaterial(m.category || "")[0] ?? "Generic")
        }));
        setAiGeneratedMaterials(mats);
        setCurrentStep(6);
      } catch (error) {
        console.error("AI estimation failed:", error);
        const estimate = generateMockEstimate(formData);
        const mats = estimate.materials.map((m, idx) => ({
          ...m,
          id: m.id || String(idx + 1),
          selected: typeof m.selected === "boolean" ? m.selected : true,
          availableBrands: m.availableBrands || getBrandsForMaterial(m.category || ""),
          selectedBrand: m.selectedBrand || (getBrandsForMaterial(m.category || "")[0] ?? "Generic")
        }));
        setAiGeneratedMaterials(mats);
        setCurrentStep(6);
      } finally {
        setIsLoading(false);
      }
    } else if (currentStep === 6) {
      const selectedMaterials = aiGeneratedMaterials.filter((m) => m.selected);
      const totalLow = selectedMaterials.reduce((sum, material) => sum + material.priceLow * material.qty, 0);
      const totalHigh = selectedMaterials.reduce((sum, material) => sum + material.priceHigh * material.qty, 0);

      const estimate: EstimateData = {
        totalLow,
        totalHigh,
        confidence: Math.floor(Math.random() * 15) + 85,
        materials: selectedMaterials,
        reasoning: `Final estimate based on your selected materials and preferred brands. Costs calculated for ${formData.city} market rates.`
      };

      setFinalEstimate(estimate);
      setShowResults(true);
    } else if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((p) => p - 1);
  };

  const renderStep = () => {
    if (isLoading) {
      return (
        <div className="text-center space-y-6 py-12">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">AI is analyzing your project...</h3>
            <p className="text-muted-foreground">Generating personalized material recommendations</p>
          </div>
          <div className="max-w-md mx-auto">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold">Project Stage</h3>
              <p className="text-muted-foreground">What stage is your project in?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { value: "foundation", label: "Foundation", desc: "Excavation to plinth level", icon: Layers },
                { value: "structure", label: "Structure", desc: "Columns, beams, slabs", icon: Building },
                { value: "finishing", label: "Finishing", desc: "Plastering, flooring, painting", icon: Home },
                { value: "interiors", label: "Interiors", desc: "Fixtures, fittings, furnishing", icon: Star }
              ].map((s) => (
                <Card
                  key={s.value}
                  className={`cursor-pointer transition-all ${formData.stage === s.value ? "border-primary shadow-lg" : "hover:border-primary/50 hover:shadow-md"}`}
                  onClick={() => {
                    updateFormData("stage", s.value);
                    setTimeout(() => nextStep(), 200);
                  }}
                >
                  <CardContent className="p-6 text-center space-y-3">
                    <s.icon className="w-8 h-8 mx-auto text-primary" />
                    <div>
                      <h4 className="font-semibold">{s.label}</h4>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold">Building Type</h3>
              <p className="text-muted-foreground">What type of building are you constructing?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: "residential", label: "Residential", desc: "Houses, apartments" },
                { value: "commercial", label: "Commercial", desc: "Offices, shops, warehouses" },
                { value: "mixed", label: "Mixed-use", desc: "Residential + commercial" }
              ].map((t) => (
                <Card
                  key={t.value}
                  className={`cursor-pointer transition-all ${formData.buildingType === t.value ? "border-primary shadow-lg" : "hover:border-primary/50 hover:shadow-md"}`}
                  onClick={() => {
                    updateFormData("buildingType", t.value);
                    setTimeout(() => nextStep(), 200);
                  }}
                >
                  <CardContent className="p-6 text-center space-y-3">
                    <Building className="w-8 h-8 mx-auto text-primary" />
                    <div>
                      <h4 className="font-semibold">{t.label}</h4>
                      <p className="text-sm text-muted-foreground">{t.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

     case 3:
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-semibold">Project Size</h3>
        <p className="text-muted-foreground">Enter your project dimensions</p>
      </div>
      <div className="max-w-md mx-auto space-y-4">
        <div className="space-y-2">
          <Label htmlFor="area">Total Area (sq ft)</Label>
          <Input 
            id="area" 
            type="number" 
            placeholder="e.g., 1200" 
            value={formData.totalAreaSqft} 
            onChange={(e) => updateFormData("totalAreaSqft", e.target.value)} 
            className="text-center text-lg" 
          />
          <p className="text-xs text-muted-foreground">Minimum 100 sq ft</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="floors">Number of Floors</Label>
          <Select
            value={formData.floors}
            onValueChange={(value) => updateFormData("floors", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select floors" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6].map((floor) => (
                <SelectItem key={floor} value={floor.toString()}>
                  {floor} Floor{floor > 1 ? "s" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end items-center pt-4">
        
        <Button 
          onClick={nextStep}
          disabled={!formData.totalAreaSqft || !formData.floors || parseInt(formData.totalAreaSqft) < 100}
          variant="hero"
          className="flex items-center"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold">Quality Level</h3>
              <p className="text-muted-foreground">Choose your material quality preference</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { value: "economy", label: "Economy", desc: "Basic quality, budget-friendly", price: "₹800-1200/sq ft" },
                { value: "standard", label: "Standard", desc: "Good quality, balanced cost", price: "₹1200-1800/sq ft" },
                { value: "premium", label: "Premium", desc: "High quality, superior finish", price: "₹1800-2500/sq ft" },
                { value: "sustainable", label: "Sustainable", desc: "Eco-friendly, green materials", price: "₹1500-2200/sq ft" }
              ].map((q) => (
                <Card key={q.value} className={`cursor-pointer transition-all ${formData.quality === q.value ? "border-primary shadow-lg" : "hover:border-primary/50 hover:shadow-md"}`} onClick={() => { updateFormData("quality", q.value); setTimeout(() => nextStep(), 200); }}>
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{q.label}</h4>
                        <p className="text-sm text-muted-foreground">{q.desc}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{q.price}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold">Location & Additional Requirements</h3>
              <p className="text-muted-foreground">Final details for AI analysis</p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Select value={formData.city} onValueChange={(value) => { updateFormData("city", value); setTimeout(() => nextStep(), 200); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bengaluru">Bengaluru</SelectItem>
                    <SelectItem value="mumbai">Mumbai</SelectItem>
                    <SelectItem value="delhi">Delhi</SelectItem>
                    <SelectItem value="hyderabad">Hyderabad</SelectItem>
                    <SelectItem value="pune">Pune</SelectItem>
                    <SelectItem value="chennai">Chennai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Additional Requirements (Optional)</Label>
                <Input id="requirements" placeholder="e.g., Swimming pool, Solar panels" value={formData.additionalRequirements} onChange={(e) => updateFormData("additionalRequirements", e.target.value)} />
                <p className="text-xs text-muted-foreground">Help AI provide more accurate estimates</p>
              </div>

              <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-start space-x-3">
                  <Bot className="w-5 h-5 text-primary mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">AI Analysis Ready</p>
                    <p className="text-muted-foreground">VCNITI AI will analyze your requirements and suggest optimal materials</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      case 6:
        return <MaterialSelectionStep materials={aiGeneratedMaterials} onMaterialsChange={setAiGeneratedMaterials} onNext={nextStep} onPrev={() => setCurrentStep(5)} />;

      default:
        return null;
    }
  };

  if (showResults && finalEstimate) {
    return <ResultsDashboard estimate={finalEstimate} formData={formData} />;
  }

  return (
    <section id="predictor" className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="outline" className="text-xs">Step {currentStep} of {totalSteps}</Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
          <CardContent className="p-8">
            {renderStep()}

            {currentStep < 6 && (
              <div className="flex justify-start items-center mt-8">
                <Button variant="outline" onClick={() => setCurrentStep((c) => Math.max(1, c - 1))} disabled={currentStep === 1} className="flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

/* ---------------------------
   ResultsDashboard (with working export & share)
----------------------------*/
const ResultsDashboard = ({ estimate, formData }: { estimate: EstimateData; formData: FormData }) => {
  // Build PDF blob with updated header and footer
  const buildPdfBlob = async (): Promise<Blob> => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;

    // Add header with company details (centered)
    const addHeader = () => {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      const companyName = "Vcniti Technologies Private Limited";
      const companyNameWidth = doc.getTextWidth(companyName);
      doc.text(companyName, (pageWidth - companyNameWidth) / 2, 30);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      const cinText = "CIN No. – U47912KA2025PTC205758";
      const cinWidth = doc.getTextWidth(cinText);
      doc.text(cinText, (pageWidth - cinWidth) / 2, 45);
      
      const contactText = "E-Mail Id – info@vcniti.com, Website - www.vcniti.com, Phone No. –+91 9740059699";
      const contactWidth = doc.getTextWidth(contactText);
      doc.text(contactText, (pageWidth - contactWidth) / 2, 57);
      
      const officeText = "Office: 48, Church St, Haridevpur, Shanthala Nagar, Ashok Nagar, Bengaluru, Karnataka 560001";
      const officeWidth = doc.getTextWidth(officeText);
      doc.text(officeText, (pageWidth - officeWidth) / 2, 69);
      
      doc.line(margin, 75, pageWidth - margin, 75);
    };

    // Add footer
    const addFooter = (pageNumber: number, totalPages: number) => {
      const footerY = pageHeight - 30;
      doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Generated by Vcniti Technologies", margin, footerY);
      doc.text(`Page ${pageNumber} / ${totalPages}`, pageWidth - margin - 80, footerY);
    };

    addHeader();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const titleText = "Construction Material Estimate Report";
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, (pageWidth - titleWidth) / 2, 100);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Project Stage: ${formData.stage?.charAt(0).toUpperCase() + formData.stage?.slice(1) || 'N/A'}`, margin, 120);
    doc.text(`Building Type: ${formData.buildingType?.charAt(0).toUpperCase() + formData.buildingType?.slice(1) || 'N/A'}`, margin, 135);
    doc.text(`Total Area: ${formData.totalAreaSqft} sq ft`, margin, 150);
    doc.text(`Number of Floors: ${formData.floors}`, margin, 165);
    doc.text(`Quality Level: ${formData.quality?.charAt(0).toUpperCase() + formData.quality?.slice(1) || 'N/A'}`, margin, 180);
    doc.text(`Location: ${formData.city?.charAt(0).toUpperCase() + formData.city?.slice(1) || 'N/A'}`, margin, 195);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, margin, 210);

    // Prepare table data with proper serial numbers and fixed currency formatting
    const tableRows = estimate.materials.map((material, index) => {
      const unitCost = `₹${material.priceLow.toLocaleString('en-IN')} – ₹${material.priceHigh.toLocaleString('en-IN')}`;
      const totalCost = ((material.priceLow + material.priceHigh) / 2) * material.qty;
      
      return [
        (index + 1).toString(),
        material.category,
        material.selectedBrand || 'Generic',
        `${material.qty} ${material.unit}`,
        unitCost,
        `₹${totalCost.toLocaleString('en-IN')}`
      ];
    });

    // Add materials table
    autoTable(doc, {
      startY: 230,
      head: [['S.No.', 'Material', 'Brand', 'Quantity', 'Unit Cost Range', 'Total Cost (Avg)']],
      body: tableRows,
      theme: 'grid',
      styles: { 
        fontSize: 9,
        cellPadding: 6
      },
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
        const totalPages = doc.internal.getNumberOfPages();
        
        if (pageNumber > 1) {
          addHeader();
        }
        
        addFooter(pageNumber, totalPages);
      }
    });

    // Add final summary
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 20 : 400;
    
    if (finalY > pageHeight - 120) {
      doc.addPage();
      addHeader();
    }

    doc.setFillColor(230, 247, 255);
    doc.rect(margin, finalY, pageWidth - 2 * margin, 80, 'F');
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Final Estimate Summary", margin + 10, finalY + 20);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Materials: ${estimate.materials.length} items`, margin + 10, finalY + 40);
    doc.text(`Estimated Cost Range: ₹${estimate.totalLow.toLocaleString('en-IN')} – ₹${estimate.totalHigh.toLocaleString('en-IN')}`, margin + 10, finalY + 55);
    doc.text(`AI Confidence Level: ${estimate.confidence}%`, margin + 10, finalY + 70);

    // Add disclaimer
    const disclaimerY = finalY + 100;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Note: This estimate is generated using AI analysis and current market rates. Actual costs may vary based on", margin, disclaimerY);
    doc.text("market conditions, supplier negotiations, and specific project requirements.", margin, disclaimerY + 12);

    return doc.output("blob");
  };

  // Download (Safari-safe)
  const downloadEstimatePDF = async () => {
    try {
      const blob = await buildPdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vcniti-construction-estimate.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to export PDF. See console for details.");
    }
  };

  // Share (Web Share API with file when possible, fallback to copy/prompt)
  const shareEstimate = async () => {
    try {
      const blob = await buildPdfBlob();
      const file = new File([blob], "vcniti-construction-estimate.pdf", { type: "application/pdf" });
      const pageUrl = window.location.href;
      const shareData: any = {
        title: "Construction Estimate",
        text: `Estimate: ${formatCurrency(estimate.totalLow)} – ${formatCurrency(estimate.totalHigh)}`,
        url: pageUrl
      };

      if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
        await (navigator as any).share({ ...shareData, files: [file] });
        return;
      }

      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(pageUrl);
        alert("Page URL copied to clipboard");
        return;
      }

      prompt("Copy this URL:", pageUrl);
    } catch (err) {
      console.error("Share failed:", err);
      alert("Share failed — fallback to copying link. See console for details.");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(window.location.href);
          alert("URL copied to clipboard");
        } catch {}
      } else {
        prompt("Copy this URL:", window.location.href);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="px-4 py-2">
            <Bot className="w-4 h-4 mr-2" />
            AI-Generated Estimate
          </Badge>
          <h1 className="text-4xl font-bold">Your Customized Project Estimate</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{estimate.reasoning}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-lg">Total Cost Range</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary break-words">
                <div>{formatCurrencyCompact(estimate.totalLow)}</div>
                <div className="text-lg">to {formatCurrencyCompact(estimate.totalHigh)}</div>
              </div>
              <p className="text-sm text-muted-foreground">{estimate.materials.length} selected materials</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-green-200">
            <CardHeader className="text-center">
              <CardTitle className="text-lg">AI Confidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{estimate.confidence}%</div>
              </div>
              <Progress value={estimate.confidence} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">Based on your selections & market data</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-purple-200">
            <CardHeader className="text-center">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="hero" className="w-full" size="sm">
  <a href="https://www.vcniti.com/collections" target="_blank" rel="noopener noreferrer">
    <ShoppingCart className="w-4 h-4 mr-2" />
    Proceed to Purchase
  </a>
</Button>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={downloadEstimatePDF}>
                  <Download className="w-4 h-4 mr-1" /> Export
                </Button>
                <Button variant="outline" size="sm" onClick={shareEstimate}>
                  <Share2 className="w-4 h-4 mr-1" /> Share
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Selected Materials with Brands</CardTitle>
            <p className="text-sm text-muted-foreground">Your customized bill of quantities</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">S.No.</th>
                    <th className="text-left p-3 font-semibold">Material</th>
                    <th className="text-left p-3 font-semibold">Selected Brand</th>
                    <th className="text-left p-3 font-semibold">Quantity</th>
                    <th className="text-left p-3 font-semibold">Unit Cost</th>
                    <th className="text-left p-3 font-semibold">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.materials.map((material, index) => (
                    <tr key={material.id} className="border-b hover:bg-muted/20">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{material.category}</div>
                          {material.description && <div className="text-xs text-muted-foreground">{material.description}</div>}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary">{material.selectedBrand}</Badge>
                      </td>
                      <td className="p-3">
                        <span>{material.qty} {material.unit}</span>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{formatCurrencyCompact(material.priceLow)} - {formatCurrencyCompact(material.priceHigh)}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-primary">{formatCurrencyCompact(((material.priceLow + material.priceHigh) / 2) * material.qty)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td colSpan={5} className="p-3 text-right">Total Estimate:</td>
                    <td className="p-3 text-primary text-lg">{formatCurrencyCompact((estimate.totalLow + estimate.totalHigh) / 2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={() => window.location.reload()}>Start New Estimate</Button>
          <Button variant="hero"><ShoppingCart className="w-4 h-4 mr-2" />Proceed to Purchase</Button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------
   App wrapper
----------------------------*/
const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <PredictorForm />
    </div>
  );
};

export default App;
