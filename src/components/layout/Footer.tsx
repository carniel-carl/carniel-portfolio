const Footer = () => {
  const today = new Date().getFullYear();
  return (
    <footer className="px-16 mb-32">
      <p className="text-sm text-center italic text-wrap opacity-50">
        All right reserved, Nmugha Chimezie (Carniel) &copy;{today}
      </p>
    </footer>
  );
};

export default Footer;
