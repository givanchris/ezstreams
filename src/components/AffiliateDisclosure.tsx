/**
 * Amazon Associates compliance disclosure component
 * Required by Amazon Associates program
 */

interface AffiliateDisclosureProps {
  className?: string;
  variant?: 'inline' | 'footer';
}

const AffiliateDisclosure = ({ className = '', variant = 'inline' }: AffiliateDisclosureProps) => {
  const baseStyles = 'text-muted-foreground/70 text-xs';
  const variantStyles = variant === 'footer' 
    ? 'text-center mt-2' 
    : 'text-center mt-4';
  
  return (
    <p className={`${baseStyles} ${variantStyles} ${className}`}>
      As an Amazon Associate, we may earn from qualifying purchases.
    </p>
  );
};

export default AffiliateDisclosure;
