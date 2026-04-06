import { useState } from 'react';
import { createPlaceholderAvatar } from '../utils/tweet';

interface AvatarProps {
  src: string;
  label: string;
}

export function Avatar({ src, label }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const fallback = createPlaceholderAvatar(label);

  return (
    <img
      className="avatar"
      src={failed || !src ? fallback : src}
      alt={label}
      onError={() => setFailed(true)}
    />
  );
}
