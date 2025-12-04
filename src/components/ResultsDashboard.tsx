import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Download, Share2, Building, Calculator } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface Material {
  category: string;
  qty: number;
  unit: string;
  priceLow: number;
  priceHigh: number;
  selected?: boolean;
  brand?: string;
}

interface EstimateData {
  totalLow: number;
  totalHigh: number;
  confidence: number;
  materials: Material[];
}

const brandRecommendations: Record<string, string[]> = {
  Cement: ["UltraTech", "ACC", "Ambuja"],
  Steel: ["Tata Tiscon", "SAIL", "JSW Steel"],
  Bricks: ["Wienerberger", "Fly Ash Bricks", "Clay Bricks"],
  Sand: ["River Sand", "M-Sand", "Robo Sand"],
  Tiles: ["Kajaria", "Somany", "Johnson"],
  Plywood: ["Century Ply", "Greenply", "Kitply"],
  Electrical: ["Havells", "Anchor", "Legrand"],
  Plumbing: ["Jaquar", "Hindware", "Cera"]
};

const ResultsDashboard: React.FC = () => {
  const [estimate, setEstimate] = useState<EstimateData | null>(null);

  useEffect(() => {
    const savedEstimate = localStorage.getItem("currentEstimate");
    if (savedEstimate) {
      const parsed: EstimateData = JSON.parse(savedEstimate);
      parsed.materials = parsed.materials.map((m) => ({
        ...m,
        selected: true,
        brand: brandRecommendations[m.category]?.[0] || "Generic"
      }));
      setEstimate(parsed);
    }
  }, []);

  if (!estimate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Calculator className="w-16 h-16 mx-auto text-primary animate-pulse" />
          <h2 className="text-2xl font-semibold">No estimate found</h2>
          <p className="text-muted-foreground">
            Please complete the predictor form first.
          </p>
          <Button onClick={() => (window.location.hash = "")}>
            Go Back to Predictor
          </Button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);

  const toggleMaterial = (index: number) => {
    setEstimate((prev) =>
      prev
        ? {
            ...prev,
            materials: prev.materials.map((m, i) =>
              i === index ? { ...m, selected: !m.selected } : m
            )
          }
        : prev
    );
  };

  const changeBrand = (index: number, brand: string) => {
    setEstimate((prev) =>
      prev
        ? {
            ...prev,
            materials: prev.materials.map((m, i) =>
              i === index ? { ...m, brand } : m
            )
          }
        : prev
    );
  };

  const calcTotal = () => {
    const selected = estimate.materials.filter((m) => m.selected);
    const low = selected.reduce((s, m) => s + m.priceLow, 0);
    const high = selected.reduce((s, m) => s + m.priceHigh, 0);
    return { low, high };
  };

  const total = calcTotal();

  const colors = ["#ff6b35","#004e89","#009639","#fccc04","#8e44ad","#e74c3c"];
  const pieData = estimate.materials
    .filter((m) => m.selected)
    .map((m, i) => ({
      name: m.category,
      value: Math.round((m.priceLow + m.priceHigh) / 2),
      color: colors[i % colors.length]
    }));

  const downloadEstimateReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Construction Estimate Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Confidence: ${estimate.confidence}%`, 14, 30);
    doc.text(`Total Range: ${formatCurrency(total.low)} – ${formatCurrency(total.high)}`, 14, 40);

    const selectedMaterials = estimate.materials.filter(m => m.selected);
    if (selectedMaterials.length > 0) {
      autoTable(doc, {
        startY: 50,
        head: [['Material', 'Brand', 'Qty', 'Cost Range']],
        body: selectedMaterials.map(m => [
          m.category,
          m.brand,
          `${m.qty} ${m.unit}`,
          `${formatCurrency(m.priceLow)} – ${formatCurrency(m.priceHigh)}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [0, 123, 255] },
      });
    }

    doc.save("estimate.pdf");
  };

  return (
    <div className="bg-gradient-surface py-20 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="px-4 py-2">
            <Building className="w-4 h-4 mr-2" />
            Estimate Generated
          </Badge>
          <h1 className="text-4xl font-bold">Your Project Estimate</h1>
          <p className="text-muted-foreground">
            Adjust selections and brands to refine your cost
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>Total Range</CardTitle></CardHeader>
            <CardContent className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(total.low)} – {formatCurrency(total.high)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Confidence</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xl font-bold">{estimate.confidence}%</div>
              <Progress value={estimate.confidence} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={downloadEstimateReport}>
                <Download className="w-4 h-4 mr-2"/> PDF
              </Button>
              <Button variant="outline">
                <Share2 className="w-4 h-4 mr-2"/> Share
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="materials">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="chart">Cost Chart</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="materials">
            <Card>
              <CardHeader><CardTitle>Bill of Quantities (BOQ)</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full border">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="p-2">✔</th>
                      <th className="p-2">Material</th>
                      <th className="p-2">Brand</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Cost Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimate.materials.map((m, i) => (
                      <tr key={i}>
                        <td className="text-center">
                          <input type="checkbox" checked={m.selected} onChange={() => toggleMaterial(i)} />
                        </td>
                        <td className="p-2">{m.category}</td>
                        <td className="p-2">
                          <select
                            value={m.brand}
                            onChange={(e) => changeBrand(i, e.target.value)}
                            className="border rounded px-2 py-1"
                          >
                            {brandRecommendations[m.category]?.map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                            <option value="Generic">Generic</option>
                          </select>
                        </td>
                        <td className="p-2">{m.qty} {m.unit}</td>
                        <td className="p-2">
                          {formatCurrency(m.priceLow)} – {formatCurrency(m.priceHigh)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chart">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={120} dataKey="value">
                  {pieData.map((p,i)=><Cell key={i} fill={p.color}/>)}
                </Pie>
                <Tooltip formatter={(val)=>formatCurrency(Number(val))}/>
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="insights">
            <Card><CardContent>
              <p className="text-sm">
                Adjusting brands or deselecting materials instantly updates your estimate.
                Final cost: <strong>{formatCurrency(total.low)} – {formatCurrency(total.high)}</strong>
              </p>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ResultsDashboard;
