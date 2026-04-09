'use client';

interface AmenityCardProps {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

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

export default function AmenityCard({ id, name, description }: AmenityCardProps) {
  const emoji = emojiMap[id] || '✨';

  return (
    <div
      style={{
        background: "rgba(30,48,18,0.4)",
        border: "1px solid rgba(200,169,110,0.12)",
        padding: "32px 28px",
        transition: "border-color 0.3s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(200,169,110,0.4)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(200,169,110,0.12)")}
    >
      <div style={{ fontSize: "32px", marginBottom: "16px" }}>{emoji}</div>
      <h4
        className="font-display mb-3"
        style={{ fontSize: "20px", color: "#f7f2e8", fontWeight: 300 }}
      >
        {name}
      </h4>
      <p
        className="font-body"
        style={{ fontSize: "13px", color: "rgba(240,235,224,0.5)", fontWeight: 300, lineHeight: 1.75 }}
      >
        {description}
      </p>
    </div>
  );
}
