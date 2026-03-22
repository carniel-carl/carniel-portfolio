import BackButton from "@/components/general/BackButton";

const PageHeader = ({
  showBackBtn,
  title,
}: {
  showBackBtn: boolean;
  title: string;
}) => {
  return (
    <div className="flex items-center gap-3 ">
      {showBackBtn && <BackButton />}
      <h2 className="text-2xl font-bold ">{title}</h2>
    </div>
  );
};

export default PageHeader;
