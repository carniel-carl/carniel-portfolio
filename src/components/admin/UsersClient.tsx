"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { registerUser, updateUser, deleteUser } from "@/lib/actions/users";

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

export default function UsersClient({ users, currentUserEmail }: UsersClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    isAdmin: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const currentUserIsSuper = users.find(
    (u) => u.email === currentUserEmail
  )?.isAdmin;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await registerUser(formData);
      toast.success("Admin user registered successfully");
      setDialogOpen(false);
      setFormData({ email: "", name: "", password: "", isAdmin: false });
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to register user"
      );
    }

    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      toast.success("User deleted");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete user"
      );
    }
  };

  const handleToggleAdmin = async (id: string, currentIsAdmin: boolean) => {
    try {
      await updateUser(id, { isAdmin: !currentIsAdmin });
      toast.success(
        `User ${!currentIsAdmin ? "promoted to" : "removed from"} super admin`
      );
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update user"
      );
    }
  };

  const columns = useMemo<ColumnDef<User>[]>(() => {
    const cols: ColumnDef<User>[] = [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const isCurrentUser = row.original.email === currentUserEmail;
          return (
            <span className="font-medium">
              {row.original.name || "—"}
              {isCurrentUser && (
                <span className="text-xs text-muted-foreground ml-2">
                  (you)
                </span>
              )}
            </span>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "isAdmin",
        header: "Role",
        cell: ({ row }) =>
          row.getValue("isAdmin") ? (
            <Badge variant="default">Super Admin</Badge>
          ) : (
            <Badge variant="secondary">Admin</Badge>
          ),
      },
      {
        accessorKey: "createdAt",
        header: "Joined",
        cell: ({ row }) =>
          new Date(row.getValue("createdAt")).toLocaleDateString(),
      },
    ];

    if (currentUserIsSuper) {
      cols.push({
        id: "actions",
        header: () => <span className="text-right block">Actions</span>,
        cell: ({ row }) => {
          const isCurrentUser = row.original.email === currentUserEmail;
          if (isCurrentUser) return null;

          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleToggleAdmin(row.original.id, row.original.isAdmin)
                }
                title={
                  row.original.isAdmin
                    ? "Remove super admin"
                    : "Make super admin"
                }
              >
                {row.original.isAdmin ? (
                  <ShieldOff className="size-4" />
                ) : (
                  <Shield className="size-4" />
                )}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete {row.original.name || row.original.email}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove this admin account. This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(row.original.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        },
      });
    }

    return cols;
  }, [currentUserIsSuper, currentUserEmail]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Admin Users</h2>
        {currentUserIsSuper && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4 mr-2" />
                Register Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register New Admin</DialogTitle>
                <DialogDescription>
                  Create a new admin account. Only super admins can do this.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Name</Label>
                  <Input
                    id="reg-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email *</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password *</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Min 6 characters"
                    minLength={6}
                    required
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="reg-isAdmin"
                    checked={formData.isAdmin}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isAdmin: checked })
                    }
                  />
                  <Label htmlFor="reg-isAdmin">Super Admin</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Super admins can register and manage other admin users.
                </p>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Registering..." : "Register Admin"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!currentUserIsSuper && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Restricted Access</CardTitle>
            <CardDescription>
              Only super admins can register new users or manage existing ones.
              Contact a super admin if you need changes.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <DataTable columns={columns} data={users} paginated={false} />
    </div>
  );
}
