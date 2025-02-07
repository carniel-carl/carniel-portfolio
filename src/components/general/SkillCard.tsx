import { LucideProps } from "lucide-react";
import { IconType } from "react-icons";

const SkillCard = ({
  title,
  Icon,
}: {
  title: string;
  Icon: React.FC<LucideProps> | IconType;
}) => {
  return (
    <article className="flex flex-col items-center gap-2 p-[1.2em] lg:w-40 md:w-32 w-24  rounded-lg text-foreground border-b-4 border-accent bg-background shadow-md">
      <Icon className="md:size-16 size-10" />
      <p className="leading-4 text-[0.8em] md:text-base text-center">{title}</p>
    </article>
  );
};

export default SkillCard;
