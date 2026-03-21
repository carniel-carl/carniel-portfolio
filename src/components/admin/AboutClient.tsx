"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import TiptapEditor from "@/components/admin/TiptapEditor";
import { X } from "lucide-react";
import { updateAbout } from "@/lib/actions/about";

interface AboutData {
  id: string;
  bio: string;
  profilePicUrl: string;
  resumeUrl: string;
}

export default function AboutClient({
  about: initialAbout,
}: {
  about: AboutData;
}) {
  const [about, setAbout] = useState<AboutData>(initialAbout);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    try {
      await updateAbout({
        bio: about.bio,
        profilePicUrl: about.profilePicUrl,
        resumeUrl: about.resumeUrl,
      });
      toast.success("About section updated");
    } catch {
      toast.error("Failed to update");
    }

    setSaving(false);
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Edit About Section</h2>

      <div className="space-y-6">
        {/* Profile Picture */}
        <div className="space-y-2">
          <Label>Profile Picture</Label>
          {about.profilePicUrl && (
            <div className="relative w-32 h-32 rounded-lg overflow-hidden mb-2">
              <Image
                src={about.profilePicUrl}
                alt="Profile"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="eager"
              />
              <button
                onClick={() => setAbout({ ...about, profilePicUrl: "" })}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <X className="size-3" />
              </button>
            </div>
          )}
          <UploadButton<OurFileRouter, "imageUploader">
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              if (res?.[0]) {
                setAbout({ ...about, profilePicUrl: res[0].ufsUrl });
                toast.success("Image uploaded");
              }
            }}
            onUploadError={(err) => {
              toast.error(err.message);
            }}
          />
          <Input
            placeholder="Or enter URL: /images/profile-pic.jpg"
            value={about.profilePicUrl}
            onChange={(e) =>
              setAbout({ ...about, profilePicUrl: e.target.value })
            }
          />
        </div>

        {/* Resume */}
        <div className="space-y-2">
          <Label>Resume</Label>
          {about.resumeUrl && (
            <p className="text-sm text-muted-foreground">
              Current: {about.resumeUrl}
            </p>
          )}
          <UploadButton<OurFileRouter, "documentUploader">
            endpoint="documentUploader"
            onClientUploadComplete={(res) => {
              if (res?.[0]) {
                setAbout({ ...about, resumeUrl: res[0].ufsUrl });
                toast.success("Resume uploaded");
              }
            }}
            onUploadError={(err) => {
              toast.error(err.message);
            }}
          />
          <Input
            placeholder="Or enter URL: /chimezie-resume.pdf"
            value={about.resumeUrl}
            onChange={(e) => setAbout({ ...about, resumeUrl: e.target.value })}
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label>Bio</Label>
          <TiptapEditor
            content={about.bio}
            onChange={(html) => setAbout({ ...about, bio: html })}
            placeholder="Write your bio..."
          />
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
