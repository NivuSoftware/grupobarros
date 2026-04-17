export const Logo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center ${className}`}>
    <img
      src="/images/logo.png"
      alt="Grupo Barros"
      className="h-16 w-auto object-contain sm:h-20"
      width={1908}
      height={2037}
    />
  </div>
);
