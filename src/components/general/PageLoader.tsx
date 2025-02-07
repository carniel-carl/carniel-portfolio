import { Loader } from "lucide-react";

const PageLoader = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-zinc-950">
      <Loader className="animate-spin size-12 text-green-300" />
    </div>
  );
};

export default PageLoader;
