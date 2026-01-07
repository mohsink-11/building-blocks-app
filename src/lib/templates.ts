export const seedTemplates = [
  {
    id: "t1",
    name: "BOM Standard Transform",
    description: "Standard BOM transformation with parent-child relationships",
    category: "BOM",
    usageCount: 23,
    lastUsed: "2 days ago",
  },
  {
    id: "t2",
    name: "Inventory Mapping",
    description: "Maps inventory columns to ERP system format",
    category: "Inventory",
    usageCount: 15,
    lastUsed: "1 week ago",
  },
  {
    id: "t3",
    name: "Parts List Cleanup",
    description: "Cleans and normalizes parts list data",
    category: "Parts",
    usageCount: 8,
    lastUsed: "3 weeks ago",
  },
];

export function readTemplatesFromStorage() {
  try {
    const raw = localStorage.getItem('templates_v1');
    return raw ? JSON.parse(raw) : seedTemplates;
  } catch (e) {
    return seedTemplates;
  }
}
