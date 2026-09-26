"use client";

import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { deleteUser, registerUser, updateUser } from "@/lib/actions/users";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import {
  Info,
  Loader2,
  MoreHorizontal,
  Shield,
  ShieldOff,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type User = {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  createdAt: string;
};

interface UsersClientProps {
  users: User[];
  currentUserEmail: string;
}

const emptyForm = { email: "", name: "", password: "", isAdmin: false };

function initials(user: User) {
  const source = user.name?.trim() || user.email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function UsersClient({ users, currentUserEmail }: UsersClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const currentUserIsSuper = users.find((u) => u.email === currentUserEmail)?.isAdmin;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await registerUser(formData);
      toast.success(`${formData.name || formData.email} can now sign in`);
      setDialogOpen(false);
      setFormData(emptyForm);
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not register this user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id);
      toast.success("User removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove user");
    }
  };

  const handleToggleAdmin = (user: User) => {
    setBusyId(user.id);
    startTransition(async () => {
      try {
        await updateUser(user.id, { isAdmin: !user.isAdmin });
        toast.success(
          user.isAdmin
            ? `${user.name || user.email} is now an admin`
            : `${user.name || user.email} is now a super admin`,
        );
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not update role");
      } finally {
        setBusyId(null);
      }
    });
  };

  return (
    <div className="max-w-4xl">
      <AdminPageHeader
        title="Users"
        description="People who can sign in to this admin. Super admins can manage everyone else."
        actions={
          currentUserIsSuper && (
            <Button
              onClick={() => {
                setFormError(null);
                setDialogOpen(true);
              }}
            >
              <UserPlus />
              Add user
            </Button>
          )
        }
      />

      {/* One panel: the first block after the header overlaps the band */}
      <div className="surface overflow-hidden">
        {!currentUserIsSuper && (
          <div className="flex items-start gap-3 border-b bg-muted/40 px-4 py-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">
              You can view the team, but only a super admin can add, remove or change roles.
            </p>
          </div>
        )}

        <ul className="divide-y">
          {users.map((user) => {
            const isYou = user.email === currentUserEmail;
            const busy = busyId === user.id;
            return (
              <li
                key={user.id}
                aria-busy={busy}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 transition-opacity",
                  busy && "opacity-50",
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold",
                    isYou ? "bg-accent text-accent-on" : "bg-muted text-foreground/80",
                  )}
                >
                  {initials(user)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {user.name || user.email.split("@")[0]}
                    {isYou && <span className="ml-1.5 font-normal text-muted-foreground">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  Joined {dayjs(user.createdAt).format("MMM YYYY")}
                </span>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    user.isAdmin ? "bg-primary/15 text-accent-ink" : "bg-muted text-muted-foreground",
                  )}
                >
                  {user.isAdmin && <Shield className="size-3" />}
                  {user.isAdmin ? "Super admin" : "Admin"}
                </span>
                {currentUserIsSuper && !isYou ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={busy}
                        className="size-8 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={`Actions for ${user.name || user.email}`}
                      >
                        {busy ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 rounded-xl">
                      <DropdownMenuItem onSelect={() => handleToggleAdmin(user)}>
                        {user.isAdmin ? <ShieldOff className="size-4" /> : <Shield className="size-4" />}
                        {user.isAdmin ? "Remove super admin" : "Make super admin"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => setDeleteTarget(user)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        Remove user
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  currentUserIsSuper && <span className="size-8 shrink-0" aria-hidden />
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !submitting && setDialogOpen(open)}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">Add a user</DialogTitle>
            <DialogDescription>
              They sign in with this email and password. Share the password privately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Name</Label>
              <Input
                id="reg-name"
                className="h-10"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                className="h-10"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                type="password"
                className="h-10"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength={6}
                autoComplete="new-password"
                aria-describedby="reg-password-help"
                required
              />
              <p id="reg-password-help" className="text-xs text-muted-foreground">
                At least 6 characters.
              </p>
            </div>
            <label
              htmlFor="reg-isAdmin"
              className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-3"
            >
              <span>
                <span className="block text-sm font-medium">Super admin</span>
                <span className="block text-xs text-muted-foreground">
                  Can add, remove and promote other users.
                </span>
              </span>
              <Switch
                id="reg-isAdmin"
                checked={formData.isAdmin}
                onCheckedChange={(checked) => setFormData({ ...formData, isAdmin: checked })}
              />
            </label>

            {formError && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="hover:bg-muted"
                disabled={submitting}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />}
                Add user
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Remove ${deleteTarget?.name || deleteTarget?.email || "user"}?`}
        description="They lose access to the admin immediately. This cannot be undone."
        confirmLabel="Remove"
        onConfirm={handleDelete}
      />
    </div>
  );
}
