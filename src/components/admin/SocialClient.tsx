"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateSocialLinks } from "@/lib/actions/social";

interface SocialLink {
  id: string;
  name: string;
  link: string;
}

const socialPlatforms = ["linkedin", "github", "twitter", "instagram"];

export default function SocialClient({ links: initialLinks }: { links: SocialLink[] }) {
  const map: Record<string, string> = {};
  initialLinks.forEach((link) => {
    map[link.name] = link.link;
  });
  socialPlatforms.forEach((p) => {
    if (!map[p]) map[p] = "";
  });

  const [links, setLinks] = useState<Record<string, string>>(map);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const payload = Object.entries(links).map(([name, link]) => ({
      name,
      link,
    }));

    try {
      await updateSocialLinks(payload);
      toast.success("Social links updated");
    } catch {
      toast.error("Failed to update");
    }

    setSaving(false);
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold mb-6">Social Links</h2>

      <div className="space-y-4">
        {socialPlatforms.map((platform) => (
          <div key={platform} className="space-y-2">
            <Label className="capitalize">{platform}</Label>
            <Input
              placeholder={`Enter your ${platform} URL`}
              value={links[platform] || ""}
              onChange={(e) =>
                setLinks({ ...links, [platform]: e.target.value })
              }
            />
          </div>
        ))}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
