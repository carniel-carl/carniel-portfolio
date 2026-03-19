"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { iconNames, getIcon } from "@/lib/icon-map";
import { createSkill, updateSkill, deleteSkill } from "@/lib/actions/skills";

const MAX_VISIBLE_ICONS = 60;

interface Skill {
  id: string;
  title: string;
  iconName: string;
  iconLib: string;
  order: number;
}

export default function SkillsClient({ skills }: { skills: Skill[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [form, setForm] = useState({
    title: "",
    iconName: "",
    iconLib: "lucide",
    order: 0,
  });
  const [iconSearch, setIconSearch] = useState("");

  const openCreate = () => {
    setEditingSkill(null);
    setForm({ title: "", iconName: "", iconLib: "lucide", order: skills.length });
    setIconSearch("");
    setDialogOpen(true);
  };

  const openEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setForm({
      title: skill.title,
      iconName: skill.iconName,
      iconLib: skill.iconLib,
      order: skill.order,
    });
    setIconSearch("");
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.iconName) {
      toast.error("Title and icon are required");
      return;
    }

    try {
      if (editingSkill) {
        await updateSkill(editingSkill.id, form);
        toast.success("Skill updated");
      } else {
        await createSkill(form);
        toast.success("Skill created");
      }
      setDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSkill(deleteId);
      toast.success("Skill deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    }
    setDeleteId(null);
  };

  const filteredIcons = useMemo(() => {
    const query = iconSearch.toLowerCase().trim();
    if (!query) return iconNames.slice(0, MAX_VISIBLE_ICONS);
    return iconNames
      .filter((name) => name.toLowerCase().includes(query))
      .slice(0, MAX_VISIBLE_ICONS);
  }, [iconSearch]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Skills</h2>
        <Button onClick={openCreate}>
          <Plus className="size-4 mr-2" />
          Add Skill
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {skills.map((skill) => {
          const IconComponent = getIcon(skill.iconName);
          return (
            <div
              key={skill.id}
              className="flex flex-col items-center gap-2 p-4 border rounded-md group relative"
            >
              {IconComponent && <IconComponent className="size-6 opacity-70" />}
              <span className="text-sm text-center">{skill.title}</span>
              <span className="text-xs text-muted-foreground">#{skill.order}</span>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => openEdit(skill)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  onClick={() => setDeleteId(skill.id)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <Trash2 className="size-3 text-destructive" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSkill ? "Edit Skill" : "Add Skill"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) =>
                  setForm({ ...form, order: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <Input
                placeholder="Search Lucide icons... (e.g. Code, Globe, Database)"
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
              />
              <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                {filteredIcons.map((name) => {
                  const Icon = getIcon(name);
                  if (!Icon) return null;
                  return (
                    <button
                      type="button"
                      key={name}
                      onClick={() =>
                        setForm({
                          ...form,
                          iconName: name,
                          iconLib: "lucide",
                        })
                      }
                      className={`p-2 rounded flex flex-col items-center gap-1 hover:bg-muted transition-colors ${
                        form.iconName === name
                          ? "bg-primary/10 ring-2 ring-primary"
                          : ""
                      }`}
                      title={name}
                    >
                      <Icon className="size-5" />
                    </button>
                  );
                })}
                {filteredIcons.length === 0 && (
                  <p className="col-span-6 text-center text-sm text-muted-foreground py-4">
                    No icons found. Try a different search.
                  </p>
                )}
              </div>
              {iconSearch && filteredIcons.length === MAX_VISIBLE_ICONS && (
                <p className="text-xs text-muted-foreground">
                  Showing first {MAX_VISIBLE_ICONS} results. Type more to narrow down.
                </p>
              )}
              {form.iconName && (
                <p className="text-xs text-muted-foreground">
                  Selected: {form.iconName}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="submit">
                {editingSkill ? "Update" : "Create"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Skill</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this skill.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
