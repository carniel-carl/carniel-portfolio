"use client";

import FileDrop from "@/components/admin/form/FileDrop";
import FormSection from "@/components/admin/form/FormSection";
import { useFormShortcuts } from "@/components/admin/form/useFormShortcuts";
import { Kbd } from "@/components/admin/shell/CommandMenu";
import TiptapEditor from "@/components/admin/TiptapEditor";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AVAILABILITY } from "@/lib/availability";
import { updateAbout } from "@/lib/actions/about";
import { adminZ } from "@/lib/admin-z";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { toast } from "sonner";

// Typing in the contact fields re-renders the page; memo keeps the editor
// (and its toolbar) out of that unless the bio itself changed
const BioEditor = memo(TiptapEditor);

// ~420 IANA zones, built once rather than on every keystroke. Older Safari
// (< 15.4) lacks supportedValuesOf, so fall back to free text there.
const TIMEZONES: string[] = (() => {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [];
  }
})();

interface AboutData {
  id: string;
  bio: string;
  profilePicUrl: string;
  resumeUrl: string;
  availability?: string | null;
  availabilityNote?: string | null;
  contactEmail?: string | null;
  timezone?: string | null;
}

type Editable = {
  bio: string;
  profilePicUrl: string;
  resumeUrl: string;
  availability: string;
  availabilityNote: string;
  contactEmail: string;
  timezone: string;
};

const pick = (a: AboutData | Editable): Editable => ({
  bio: a.bio,
  profilePicUrl: a.profilePicUrl,
  resumeUrl: a.resumeUrl,
  availability: a.availability ?? "",
  availabilityNote: a.availabilityNote ?? "",
  contactEmail: a.contactEmail ?? "",
  timezone: a.timezone ?? "",
});

// text-base below md: iOS zooms into any field under 16px when it's focused
const fieldClass =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm";

export default function AboutClient({
  about: initialAbout,
}: {
  about: AboutData;
}) {
  const [saved, setSaved] = useState<Editable>(pick(initialAbout));
  const [about, setAbout] = useState<Editable>(pick(initialAbout));
  const [saving, setSaving] = useState(false);
  // The editor only reads `content` on mount; bump to remount after a discard
  const [editorKey, setEditorKey] = useState(0);

  const dirty = (Object.keys(about) as (keyof Editable)[]).some(
    (key) => about[key] !== saved[key],
  );
  const set = (key: keyof Editable) => (value: string) =>
    setAbout((a) => ({ ...a, [key]: value }));
  // Stable, so the memoised editor only re-renders when the bio changes
  const setBio = useCallback(
    (html: string) => setAbout((a) => ({ ...a, bio: html })),
    [],
  );

  const discard = () => {
    setAbout(saved);
    setEditorKey((k) => k + 1);
  };

  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await updateAbout(about);
      setSaved(about);
      toast.success("About section saved");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Could not save the about section",
      );
    } finally {
      setSaving(false);
    }
  };

  useFormShortcuts({ onSave: handleSave, dirty: dirty && !saving });

  return (
    // Bottom padding clears the fixed mobile save bar
    <div className="pb-24 lg:pb-0">
      <AdminPageHeader
        title="About"
        description="Your photo, résumé and bio as they appear in the about section."
        actions={
          // Phones use the bottom bar instead, within thumb reach
          <div className="hidden items-center gap-2 lg:flex">
            {dirty && (
              <span className="text-sm text-muted-foreground">
                Unsaved changes
              </span>
            )}
            <Button
              variant="outline"
              className="hover:bg-muted"
              disabled={!dirty || saving}
              onClick={discard}
            >
              Discard
            </Button>
            <Button onClick={handleSave} disabled={!dirty || saving}>
              {saving && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </div>
        }
      />

      {/* grid-cols-1 = minmax(0,1fr) and min-w-0 on both columns: without
          them the mobile column grows to the editor toolbar's full width
          (~685px) and the admin shell clips everything past the screen edge */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-6 lg:sticky lg:top-20 lg:self-start">
          <FormSection title="Profile photo">
            <div className="max-w-[13rem] sm:max-w-[15rem] lg:max-w-none">
              <FileDrop
                endpoint="imageUploader"
                value={about.profilePicUrl}
                onChange={(url) =>
                  setAbout((a) => ({ ...a, profilePicUrl: url }))
                }
                aspectClass="aspect-[4/5]"
                hint="Portrait crop works best"
              />
            </div>
          </FormSection>
        </aside>

        <div className="min-w-0 space-y-4">
          <FormSection
            title="Bio"
            description="Headings, lists and links are kept on the site."
          >
            <BioEditor
              key={editorKey}
              content={about.bio}
              onChange={setBio}
              placeholder="Write a few lines about yourself..."
            />
            {/* Keyboard shortcut hint is meaningless on touch screens */}
            <p className="hidden items-center gap-1.5 text-xs text-muted-foreground lg:flex">
              <Kbd>⌘</Kbd>
              <Kbd>S</Kbd>
              saves from anywhere
            </p>
          </FormSection>
          <FormSection title="Résumé">
            <FileDrop
              endpoint="documentUploader"
              value={about.resumeUrl}
              onChange={(url) => setAbout((a) => ({ ...a, resumeUrl: url }))}
              hint="PDF up to 8MB"
            />
          </FormSection>
          <FormSection
            title="Availability & contact"
            description="Shown in the hero, footer and contact section. Leave a field empty to hide it."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="availability">Status</Label>
                <select
                  id="availability"
                  className={fieldClass}
                  value={about.availability}
                  onChange={(e) => set("availability")(e.target.value)}
                >
                  <option value="">Hidden</option>
                  {Object.entries(AVAILABILITY).map(([value, { label }]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="availabilityNote">Note</Label>
                <Input
                  id="availabilityNote"
                  className="h-10"
                  placeholder="Booked until November"
                  maxLength={60}
                  enterKeyHint="next"
                  value={about.availabilityNote}
                  onChange={(e) => set("availabilityNote")(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Public email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="next"
                  className="h-10"
                  placeholder="you@example.com"
                  value={about.contactEmail}
                  onChange={(e) => set("contactEmail")(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Visitors get a one-click copy button.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Time zone</Label>
                <Input
                  id="timezone"
                  className="h-10"
                  placeholder="Africa/Lagos"
                  list={TIMEZONES.length ? "timezones" : undefined}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="done"
                  value={about.timezone}
                  onChange={(e) => set("timezone")(e.target.value)}
                />
                {TIMEZONES.length > 0 && (
                  <datalist id="timezones">
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz} />
                    ))}
                  </datalist>
                )}
                <p className="text-xs text-muted-foreground">
                  Shows your local time next to the status.
                </p>
              </div>
            </div>
          </FormSection>
        </div>
      </div>

      {/* Mobile action bar. admin.css hides it while the bio editor has focus */}
      <div
        className={cn(
          "admin-mobile-bar fixed inset-x-0 bottom-0 flex items-center gap-2 border-t bg-card/95 px-4 py-3 backdrop-blur-md [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] lg:hidden",
          adminZ.mobileBar,
        )}
      >
        <span className="flex-1 text-xs text-muted-foreground" aria-live="polite">
          {dirty ? "Unsaved changes" : "All changes saved"}
        </span>
        <Button
          variant="outline"
          className="hover:bg-muted"
          disabled={!dirty || saving}
          onClick={discard}
        >
          Discard
        </Button>
        <Button onClick={handleSave} disabled={!dirty || saving}>
          {saving && <Loader2 className="animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}
