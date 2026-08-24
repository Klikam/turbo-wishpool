interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Avatar({ name, size = 'md' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const colors = [
    'bg-[#7A3F78]',
    'bg-[#C4797A]',
    'bg-[#4A1942]',
    'bg-[#B07B8A]',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  const sz =
    size === 'sm'
      ? 'w-7 h-7 text-xs'
      : size === 'lg'
        ? 'w-12 h-12 text-lg'
        : 'w-9 h-9 text-sm';
  return (
    <div
      className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}
    >
      {initials}
    </div>
  );
}
