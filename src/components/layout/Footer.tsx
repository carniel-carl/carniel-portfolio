const Footer = () => {
  const today = new Date().getFullYear();
  return (
    <footer className="px-16 mb-4">
      <p className="text-sm text-center italic text-wrap">
        All right reserved, Nmugha Chimezie (Carniel) &copy;{today}
      </p>
    </footer>
  );
};

export default Footer;
