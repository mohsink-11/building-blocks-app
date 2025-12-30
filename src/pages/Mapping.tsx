import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  GripVertical,
  Link as LinkIcon,
  Plus,
} from "lucide-react";

// Placeholder source columns from uploaded Excel
const sourceColumns = [
  { id: "s1", name: "Item Number", type: "string" },
  { id: "s2", name: "Description", type: "string" },
  { id: "s3", name: "Quantity", type: "number" },
  { id: "s4", name: "Unit Price", type: "number" },
  { id: "s5", name: "Category", type: "string" },
  { id: "s6", name: "Supplier", type: "string" },
  { id: "s7", name: "Lead Time", type: "number" },
  { id: "s8", name: "Notes", type: "string" },
];

// Placeholder target columns for transformation
const targetColumns = [
  { id: "t1", name: "Part ID", mapped: ["s1"] },
  { id: "t2", name: "Full Description", mapped: ["s2", "s8"] },
  { id: "t3", name: "Qty", mapped: ["s3"] },
  { id: "t4", name: "Price", mapped: ["s4"] },
  { id: "t5", name: "Vendor", mapped: ["s6"] },
];

const aiSuggestions = [
  "Map 'Item Number' to 'Part ID'",
  "Combine 'Description' + 'Notes' for 'Full Description'",
  "Map 'Supplier' to 'Vendor'",
];

export default function Mapping() {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  return (
    <div className="flex-1 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 -ml-2">
          <Link to="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Column Mapping
            </h1>
            <p className="text-muted-foreground">
              Map source columns to target columns for transformation
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to={`/rules/${projectId}`}>
                Configure Rules
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/preview/${projectId}`}>
                Preview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* AI Suggestions */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">AI Suggestions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiSuggestions.map((suggestion, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mapping Interface */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Source Columns */}
        <Card>
          <CardHeader>
            <CardTitle>Source Columns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sourceColumns.map((column) => (
                <div
                  key={column.id}
                  onClick={() => setSelectedSource(column.id === selectedSource ? null : column.id)}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    selectedSource === column.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{column.name}</p>
                    <p className="text-xs text-muted-foreground">{column.type}</p>
                  </div>
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Target Columns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Target Columns</CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Column
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {targetColumns.map((column) => (
                <div
                  key={column.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div className="flex-1">
                    <p className="font-medium">{column.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {column.mapped.length > 0 ? (
                        column.mapped.map((sourceId) => {
                          const source = sourceColumns.find((s) => s.id === sourceId);
                          return (
                            <Badge key={sourceId} variant="outline" className="text-xs">
                              {source?.name}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No mapping
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Panel (Mobile: Bottom Sheet Style) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Mapping Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {targetColumns.map((col) => (
                    <th key={col.id} className="px-4 py-2 text-left font-medium">
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2">ITEM-001</td>
                  <td className="px-4 py-2">Widget Assembly - High priority</td>
                  <td className="px-4 py-2">25</td>
                  <td className="px-4 py-2">$49.99</td>
                  <td className="px-4 py-2">Acme Corp</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2">ITEM-002</td>
                  <td className="px-4 py-2">Gear Component - Standard</td>
                  <td className="px-4 py-2">100</td>
                  <td className="px-4 py-2">$12.50</td>
                  <td className="px-4 py-2">Parts Inc</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">ITEM-003</td>
                  <td className="px-4 py-2">Motor Unit - Replacement</td>
                  <td className="px-4 py-2">5</td>
                  <td className="px-4 py-2">$299.00</td>
                  <td className="px-4 py-2">MotorWorks</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
