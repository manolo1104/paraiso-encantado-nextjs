'use client';

interface AmenityCardProps {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export default function AmenityCard({ id, name, description, icon }: AmenityCardProps) {
  // Mapa de colores por amenidad
  const colorMap: Record<string, { bg: string; accent: string }> = {
    'piscina-spa': { bg: 'from-blue-500 to-cyan-400', accent: 'text-blue-700' },
    'restaurante': { bg: 'from-orange-500 to-red-400', accent: 'text-orange-700' },
    'wifi': { bg: 'from-purple-500 to-indigo-400', accent: 'text-purple-700' },
    'estacionamiento': { bg: 'from-gray-600 to-slate-500', accent: 'text-gray-700' },
    'naturista': { bg: 'from-yellow-500 to-amber-400', accent: 'text-yellow-700' },
    'tours': { bg: 'from-green-500 to-emerald-400', accent: 'text-green-700' },
    'spa': { bg: 'from-pink-500 to-rose-400', accent: 'text-pink-700' },
    'botanica': { bg: 'from-lime-500 to-green-400', accent: 'text-lime-700' },
  };

  const colors = colorMap[id] || { bg: 'from-gray-500 to-slate-400', accent: 'text-gray-700' };

  // Mapa de emojis como fallback
  const emojiMap: Record<string, string> = {
    'piscina-spa': '💧',
    'restaurante': '🍽️',
    'wifi': '📡',
    'estacionamiento': '🚗',
    'naturista': '☀️',
    'tours': '🗺️',
    'spa': '🌿',
    'botanica': '🌺',
  };

  const emoji = emojiMap[id] || '✨';

  return (
    <div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-white group">
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

      {/* Content */}
      <div className="relative p-6 flex flex-col items-center text-center">
        {/* Icon/Emoji */}
        <div className={`text-5xl mb-4 ${colors.accent}`}>
          {emoji}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">{name}</h3>

        {/* Description */}
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>

        {/* Accent Line */}
        <div className={`mt-4 h-1 w-12 bg-gradient-to-r ${colors.bg} rounded-full`} />
      </div>
    </div>
  );
}
