import Image from "next/image";

const ComingSoon = () => {
  return (
    <div className="relative w-[20rem] h-[15rem]">
      <Image
        src="/images/coming-soon.png"
        alt="coming soon"
        fill
        className="obeject-cover"
      />
    </div>
  );
};

export default ComingSoon;
