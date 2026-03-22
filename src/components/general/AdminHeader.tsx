import { auth } from "@/lib/auth";
import { Badge } from "../ui/badge";

const AdminHeader = async () => {
  const session = await auth();
  const adminUser = session?.user;

  const userName = `${adminUser?.name || ""}`.trim();
  const isSuperAdmin = adminUser?.isAdmin;
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="text-xs md:text-sm flex flex-col gap-1 items-start">
        <p className="text-secondary-foreground">
          Welcome,{" "}
          <span className="font-bold text-clr-heading">
            {userName || "User"}
          </span>
        </p>
        <Badge variant="outline" className="text-xs">
          <span className="size-2 mr-1 rounded-full bg-green-500" />
          {isSuperAdmin ? "Super Admin" : "Admin"}
        </Badge>
      </div>
    </div>
  );
};

export default AdminHeader;
