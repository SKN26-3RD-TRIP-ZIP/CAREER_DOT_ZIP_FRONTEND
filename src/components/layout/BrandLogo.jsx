import { Link } from 'react-router-dom';

export function BrandLogo({ light = false, disabled = false }) {
  const src = light
    ? '/logo/careerzip-logo-horizontal-dark.png'
    : '/logo/careerzip-logo-horizontal.png';
  const image = <img src={src} alt="Career.zip" className="h-8 w-auto" />;

  if (disabled) {
    return (
      <span aria-disabled="true" className="inline-flex cursor-default items-center">
        {image}
      </span>
    );
  }

  return (
    <Link to="/" className="inline-flex items-center">
      {image}
    </Link>
  );
}