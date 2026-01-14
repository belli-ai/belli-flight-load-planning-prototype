"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
  Ban,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

// Types
interface PackingRule {
  id: string;
  ruleText: string;
  ruleType: string;
  priority: number;
  category: string | null;
  isActive: boolean;
  examples: string[] | null;
  structuredRule: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface GroupedRules {
  [category: string]: PackingRule[];
}

const RULE_TYPES = [
  { value: "CONSTRAINT", label: "Constraint", icon: ShieldCheck, color: "bg-blue-500/10 text-blue-500" },
  { value: "PREFERENCE", label: "Preference", icon: Sparkles, color: "bg-emerald-500/10 text-emerald-500" },
  { value: "PROHIBITION", label: "Prohibition", icon: Ban, color: "bg-red-500/10 text-red-500" },
];

const CATEGORIES = [
  "DANGEROUS_GOODS",
  "WEIGHT_BALANCE",
  "TEMPERATURE",
  "LIVE_ANIMALS",
  "PERISHABLES",
  "VALUABLE_CARGO",
  "FRAGILE",
  "GENERAL",
];

export default function PackingRulesPage() {
  // State
  const [rules, setRules] = useState<PackingRule[]>([]);
  const [groupedRules, setGroupedRules] = useState<GroupedRules>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<PackingRule | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    ruleText: "",
    ruleType: "CONSTRAINT",
    priority: 50,
    category: "GENERAL",
    isActive: true,
    examples: "",
  });

  // Fetch rules
  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (!showInactive) params.set("activeOnly", "true");
      else params.set("activeOnly", "false");

      const response = await fetch(`/api/packing-rules?${params}`);
      const data = await response.json();

      if (data.success) {
        setRules(data.data.rules);
        setGroupedRules(data.data.grouped);
        // Expand all categories by default
        setExpandedCategories(new Set(Object.keys(data.data.grouped)));
      }
    } catch (error) {
      console.error("Error fetching rules:", error);
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Filter rules
  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      rule.ruleText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || rule.ruleType === filterType;
    const matchesCategory =
      filterCategory === "all" || rule.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  // Group filtered rules
  const filteredGroupedRules: GroupedRules = {};
  for (const rule of filteredRules) {
    const cat = rule.category || "GENERAL";
    if (!filteredGroupedRules[cat]) {
      filteredGroupedRules[cat] = [];
    }
    filteredGroupedRules[cat].push(rule);
  }

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Form handlers
  const resetForm = () => {
    setFormData({
      ruleText: "",
      ruleType: "CONSTRAINT",
      priority: 50,
      category: "GENERAL",
      isActive: true,
      examples: "",
    });
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (rule: PackingRule) => {
    setSelectedRule(rule);
    setFormData({
      ruleText: rule.ruleText,
      ruleType: rule.ruleType,
      priority: rule.priority,
      category: rule.category || "GENERAL",
      isActive: rule.isActive,
      examples: rule.examples?.join("\n") || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (rule: PackingRule) => {
    setSelectedRule(rule);
    setIsDeleteDialogOpen(true);
  };

  // API handlers
  const handleCreate = async () => {
    try {
      const response = await fetch("/api/packing-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          examples: formData.examples
            ? formData.examples.split("\n").filter((e) => e.trim())
            : null,
        }),
      });

      if (response.ok) {
        setIsAddDialogOpen(false);
        fetchRules();
      }
    } catch (error) {
      console.error("Error creating rule:", error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRule) return;

    try {
      const response = await fetch(`/api/packing-rules/${selectedRule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          examples: formData.examples
            ? formData.examples.split("\n").filter((e) => e.trim())
            : null,
        }),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setSelectedRule(null);
        fetchRules();
      }
    } catch (error) {
      console.error("Error updating rule:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedRule) return;

    try {
      const response = await fetch(`/api/packing-rules/${selectedRule.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setSelectedRule(null);
        fetchRules();
      }
    } catch (error) {
      console.error("Error deleting rule:", error);
    }
  };

  const handleToggleActive = async (rule: PackingRule) => {
    try {
      const response = await fetch(`/api/packing-rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });

      if (response.ok) {
        fetchRules();
      }
    } catch (error) {
      console.error("Error toggling rule:", error);
    }
  };

  // Get rule type info
  const getRuleTypeInfo = (type: string) => {
    return RULE_TYPES.find((t) => t.value === type) || RULE_TYPES[0];
  };

  // Render form dialog content
  const renderFormContent = () => (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="ruleText">Rule Text *</Label>
        <Textarea
          id="ruleText"
          value={formData.ruleText}
          onChange={(e) =>
            setFormData({ ...formData, ruleText: e.target.value })
          }
          placeholder="Enter the rule description..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ruleType">Rule Type</Label>
          <Select
            value={formData.ruleType}
            onValueChange={(value) =>
              setFormData({ ...formData, ruleType: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RULE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="size-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority (1-100)</Label>
          <Input
            id="priority"
            type="number"
            min={1}
            max={100}
            value={formData.priority}
            onChange={(e) =>
              setFormData({ ...formData, priority: parseInt(e.target.value) || 50 })
            }
          />
          <p className="text-xs text-muted-foreground">
            Higher priority = evaluated first
          </p>
        </div>

        <div className="flex items-center space-x-2 pt-6">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isActive: checked })
            }
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="examples">Examples (one per line)</Label>
        <Textarea
          id="examples"
          value={formData.examples}
          onChange={(e) =>
            setFormData({ ...formData, examples: e.target.value })
          }
          placeholder="Example 1&#10;Example 2&#10;Example 3"
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
              <BookOpen className="size-7 text-primary" />
              Packing Rules
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage cargo packing constraints, preferences, and prohibitions
            </p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 size-4" />
            Add Rule
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{rules.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-500">
                {rules.filter((r) => r.isActive).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {Object.keys(groupedRules).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Prohibitions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-500">
                {rules.filter((r) => r.ruleType === "PROHIBITION").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {RULE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showInactive"
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <Label htmlFor="showInactive" className="text-sm">
                  Show Inactive
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rules by Category */}
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">Loading rules...</p>
            </CardContent>
          </Card>
        ) : Object.keys(filteredGroupedRules).length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                No rules found. Click &quot;Add Rule&quot; to create one.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(filteredGroupedRules)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, categoryRules]) => (
                <Card key={category}>
                  <CardHeader
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedCategories.has(category) ? (
                          <ChevronDown className="size-5" />
                        ) : (
                          <ChevronRight className="size-5" />
                        )}
                        <CardTitle className="text-lg">
                          {category.replace(/_/g, " ")}
                        </CardTitle>
                        <Badge variant="secondary">
                          {categoryRules.length} rules
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {categoryRules.some((r) => r.ruleType === "PROHIBITION") && (
                          <AlertTriangle className="size-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      {categoryRules.filter((r) => r.isActive).length} active,{" "}
                      {categoryRules.filter((r) => !r.isActive).length} inactive
                    </CardDescription>
                  </CardHeader>

                  {expandedCategories.has(category) && (
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Type</TableHead>
                            <TableHead>Rule</TableHead>
                            <TableHead className="w-[80px]">Priority</TableHead>
                            <TableHead className="w-[80px]">Status</TableHead>
                            <TableHead className="w-[100px] text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryRules
                            .sort((a, b) => b.priority - a.priority)
                            .map((rule) => {
                              const typeInfo = getRuleTypeInfo(rule.ruleType);
                              return (
                                <TableRow
                                  key={rule.id}
                                  className={!rule.isActive ? "opacity-50" : ""}
                                >
                                  <TableCell>
                                    <Badge className={typeInfo.color}>
                                      <typeInfo.icon className="mr-1 size-3" />
                                      {typeInfo.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="line-clamp-2">
                                        {rule.ruleText}
                                      </p>
                                      {rule.examples && rule.examples.length > 0 && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                          Examples: {rule.examples.slice(0, 2).join(", ")}
                                          {rule.examples.length > 2 && "..."}
                                        </p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{rule.priority}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Switch
                                      checked={rule.isActive}
                                      onCheckedChange={() => handleToggleActive(rule)}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEditDialog(rule)}
                                      >
                                        <Pencil className="size-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openDeleteDialog(rule)}
                                      >
                                        <Trash2 className="size-4 text-red-500" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  )}
                </Card>
              ))}
          </div>
        )}

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Packing Rule</DialogTitle>
              <DialogDescription>
                Create a new packing rule for cargo operations
              </DialogDescription>
            </DialogHeader>
            {renderFormContent()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.ruleText}>
                Create Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Packing Rule</DialogTitle>
              <DialogDescription>
                Update the packing rule configuration
              </DialogDescription>
            </DialogHeader>
            {renderFormContent()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={!formData.ruleText}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Packing Rule</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this packing rule? This action
                cannot be undone.
                {selectedRule && (
                  <span className="mt-2 block font-medium text-foreground">
                    &quot;{selectedRule.ruleText.slice(0, 100)}
                    {selectedRule.ruleText.length > 100 ? "..." : ""}&quot;
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

