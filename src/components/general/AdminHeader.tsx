import { auth } from "@/lib/auth";

const AdminHeader = async () => {
  const session = await auth();
  const adminUser = session?.user;

  const userName = `${adminUser?.name || ""}`.trim();
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="text-xs">
        <p className="text-secondary-foreground text-sm">
          Welcome,{" "}
          <span className="font-semibold text-clr-heading">
            {userName || "User"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AdminHeader;
