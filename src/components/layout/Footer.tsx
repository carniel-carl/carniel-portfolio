const Footer = () => {
  const today = new Date().getFullYear();
  return (
    <footer className="md:px-16 px-8 pb-12 absolute bottom-0  top-full inset-x-0">
      <p className=" text-xs md:text-left text-center italic text-wrap opacity-50">
        All right reserved, Nmugha Chimezie (Carniel) &copy;{today}
      </p>
    </footer>
  );
};

export default Footer;
