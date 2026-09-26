"use client";

import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import EmptyState from "@/components/admin/ui/EmptyState";
import SearchField from "@/components/admin/ui/SearchField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSkill, deleteSkill, updateSkill } from "@/lib/actions/skills";
import { getIcon, iconNames } from "@/lib/icon-map";
import { cn } from "@/lib/utils";
import { Loader2, Plus, SearchX, Trash2, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const MAX_VISIBLE_ICONS = 60;

interface Skill {
  id: string;
  title: string;
  iconName: string;
  iconLib: string;
  order: number;
}

const emptyForm = { title: "", iconName: "", iconLib: "lucide", order: 0 };

export default function SkillsClient({ skills }: { skills: Skill[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [iconSearch, setIconSearch] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingSkill(null);
    setForm({ ...emptyForm, order: skills.length });
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
    if (!form.title.trim() || !form.iconName) {
      toast.error("Add a name and pick an icon");
      return;
    }

    setSaving(true);
    try {
      if (editingSkill) {
        await updateSkill(editingSkill.id, form);
        toast.success("Skill updated");
      } else {
        await createSkill(form);
        toast.success("Skill added");
      }
      setDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("Could not save the skill");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSkill(deleteTarget.id);
      toast.success("Skill deleted");
      router.refresh();
    } catch {
      toast.error("Could not delete the skill");
    }
  };

  const filteredIcons = useMemo(() => {
    const q = iconSearch.toLowerCase().trim();
    const matches = q ? iconNames.filter((name) => name.toLowerCase().includes(q)) : iconNames;
    return matches.slice(0, MAX_VISIBLE_ICONS);
  }, [iconSearch]);

  const filteredSkills = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? skills.filter((s) => s.title.toLowerCase().includes(q)) : skills;
  }, [skills, query]);

  const SelectedIcon = form.iconName ? getIcon(form.iconName) : null;

  return (
    <div>
      <AdminPageHeader
        title="Skills"
        description="The tools listed in the skills section, in display order."
        actions={
          <Button onClick={openCreate}>
            <Plus />
            Add skill
          </Button>
        }
      />

      {skills.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No skills yet"
          description="Add the languages, frameworks and tools you work with."
          action={
            <Button size="sm" onClick={openCreate}>
              Add skill
            </Button>
          }
        />
      ) : (
        /* One panel: the first block after the header overlaps the band */
        <div className="surface overflow-hidden">
          <div className="border-b p-3 sm:px-4">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Search skills"
              className="sm:w-72"
            />
          </div>
          {filteredSkills.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={`No skills match "${query}"`}
              className="rounded-none border-0"
            />
          ) : (
            <ul className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 sm:p-4 md:grid-cols-4 xl:grid-cols-6">
              {filteredSkills.map((skill) => {
                const IconComponent = getIcon(skill.iconName);
                return (
                  <li key={skill.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => openEdit(skill)}
                      className="flex w-full flex-col items-center gap-3 rounded-lg bg-muted/50 px-3 pb-4 pt-6 text-center transition-[background-color,transform] duration-300 ease-expo hover:bg-muted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Edit ${skill.title}`}
                    >
                      <span className="grid size-11 place-items-center rounded-lg bg-card text-foreground/80 shadow-sm transition-colors group-hover:text-accent-ink">
                        {IconComponent && <IconComponent className="size-6" />}
                      </span>
                      <span className="line-clamp-1 text-sm font-medium">{skill.title}</span>
                      <span className="tnum absolute left-3 top-2.5 text-[11px] text-muted-foreground">
                        {skill.order}
                      </span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(skill)}
                      aria-label={`Delete ${skill.title}`}
                      className="absolute right-1.5 top-1.5 size-7 text-muted-foreground opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100 [&_svg]:size-3.5"
                    >
                      <Trash2 />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !saving && setDialogOpen(open)}>
        <DialogContent className="max-h-[85dvh] max-w-lg overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">
              {editingSkill ? "Edit skill" : "Add skill"}
            </DialogTitle>
            <DialogDescription>
              Lower order numbers show first on the site.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-[1fr_96px] gap-3">
              <div className="space-y-2">
                <Label htmlFor="skill-title">Name</Label>
                <Input
                  id="skill-title"
                  className="h-10"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="TypeScript"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skill-order">Order</Label>
                <Input
                  id="skill-order"
                  type="number"
                  min={0}
                  className="tnum h-10"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="skill-icon-search">Icon</Label>
                {SelectedIcon && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <SelectedIcon className="size-3.5 text-foreground" />
                    {form.iconName}
                  </span>
                )}
              </div>
              <SearchField
                value={iconSearch}
                onChange={setIconSearch}
                placeholder="Search icons, e.g. React, Database, Globe"
              />
              <div
                role="radiogroup"
                aria-label="Icon"
                className="grid max-h-52 grid-cols-6 gap-1.5 overflow-y-auto rounded-lg border bg-muted/40 p-2 sm:grid-cols-8"
              >
                {filteredIcons.map((name) => {
                  const Icon = getIcon(name);
                  if (!Icon) return null;
                  const selected = form.iconName === name;
                  return (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      key={name}
                      onClick={() => setForm({ ...form, iconName: name, iconLib: "lucide" })}
                      className={cn(
                        "grid aspect-square place-items-center rounded-md text-foreground/80 transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected && "bg-card text-accent-ink ring-2 ring-accent-ink",
                      )}
                      title={name}
                      aria-label={name}
                    >
                      <Icon className="size-5" />
                    </button>
                  );
                })}
                {filteredIcons.length === 0 && (
                  <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                    No icons match. Try a broader word.
                  </p>
                )}
              </div>
              {filteredIcons.length === MAX_VISIBLE_ICONS && (
                <p className="text-xs text-muted-foreground">
                  Showing the first {MAX_VISIBLE_ICONS}. Keep typing to narrow it down.
                </p>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="hover:bg-muted"
                disabled={saving}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                {editingSkill ? "Save changes" : "Add skill"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.title ?? "skill"}?`}
        description="It disappears from the skills section on the site."
        onConfirm={handleDelete}
      />
    </div>
  );
}
