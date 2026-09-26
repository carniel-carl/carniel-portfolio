"use client";

import FileDrop from "@/components/admin/form/FileDrop";
import FormSection from "@/components/admin/form/FormSection";
import { useFormShortcuts } from "@/components/admin/form/useFormShortcuts";
import { Kbd } from "@/components/admin/shell/CommandMenu";
import TiptapEditor from "@/components/admin/TiptapEditor";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { updateAbout } from "@/lib/actions/about";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AboutData {
  id: string;
  bio: string;
  profilePicUrl: string;
  resumeUrl: string;
}

type Editable = Pick<AboutData, "bio" | "profilePicUrl" | "resumeUrl">;

const pick = (a: AboutData | Editable): Editable => ({
  bio: a.bio,
  profilePicUrl: a.profilePicUrl,
  resumeUrl: a.resumeUrl,
});

export default function AboutClient({ about: initialAbout }: { about: AboutData }) {
  const [saved, setSaved] = useState<Editable>(pick(initialAbout));
  const [about, setAbout] = useState<Editable>(pick(initialAbout));
  const [saving, setSaving] = useState(false);
  // The editor only reads `content` on mount; bump to remount after a discard
  const [editorKey, setEditorKey] = useState(0);

  const dirty =
    about.bio !== saved.bio ||
    about.profilePicUrl !== saved.profilePicUrl ||
    about.resumeUrl !== saved.resumeUrl;

  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await updateAbout(about);
      setSaved(about);
      toast.success("About section saved");
    } catch {
      toast.error("Could not save the about section");
    } finally {
      setSaving(false);
    }
  };

  useFormShortcuts({ onSave: handleSave, dirty: dirty && !saving });

  return (
    <div>
      <AdminPageHeader
        title="About"
        description="Your photo, résumé and bio as they appear in the about section."
        actions={
          <>
            {dirty && <span className="text-sm text-muted-foreground">Unsaved changes</span>}
            <Button
              variant="outline"
              className="hover:bg-muted"
              disabled={!dirty || saving}
              onClick={() => {
                setAbout(saved);
                setEditorKey((k) => k + 1);
              }}
            >
              Discard
            </Button>
            <Button onClick={handleSave} disabled={!dirty || saving}>
              {saving && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <FormSection title="Profile photo">
            <FileDrop
              endpoint="imageUploader"
              value={about.profilePicUrl}
              onChange={(url) => setAbout((a) => ({ ...a, profilePicUrl: url }))}
              aspectClass="aspect-[4/5]"
              hint="Portrait crop works best"
            />
          </FormSection>
          <FormSection title="Résumé">
            <FileDrop
              endpoint="documentUploader"
              value={about.resumeUrl}
              onChange={(url) => setAbout((a) => ({ ...a, resumeUrl: url }))}
              hint="PDF up to 8MB"
            />
          </FormSection>
        </aside>

        <FormSection title="Bio" description="Headings, lists and links are kept on the site.">
          <TiptapEditor
            key={editorKey}
            content={about.bio}
            onChange={(html) => setAbout((a) => ({ ...a, bio: html }))}
            placeholder="Write a few lines about yourself..."
          />
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Kbd>⌘</Kbd>
            <Kbd>S</Kbd>
            saves from anywhere
          </p>
        </FormSection>
      </div>
    </div>
  );
}
