'use client';

import Link from 'next/link';
import Image from 'next/image';

interface RoomCardProps {
  id: string;
  name: string;
  type: string;
  description: string;
  price: number;
  maxGuests: number;
  bedType: string;
  images: string[];
  cover?: string;
}

export default function RoomCard({ id, name, type, description, price, maxGuests, bedType, images, cover }: RoomCardProps) {
  const imgSrc = cover || images?.[0];

  return (
    <Link href={`/habitaciones/${id}`}>
      <div
        className="group h-full flex flex-col"
        style={{ background: "#0f0d0a" }}
      >
        {/* Image */}
        <div className="relative overflow-hidden" style={{ height: "240px" }}>
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: "linear-gradient(135deg, #1e3012 0%, #2d4a1a 100%)" }}
            />
          )}
          <div className="absolute inset-0" style={{ background: "rgba(15,13,10,0.25)" }} />
        </div>

        {/* Content */}
        <div style={{ padding: "24px 28px 28px", borderTop: "1px solid rgba(200,169,110,0.1)", flex: 1, display: "flex", flexDirection: "column" }}>
          <p
            className="font-body mb-2"
            style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#c8a96e" }}
          >
            {type}
          </p>
          <h3
            className="font-display mb-3"
            style={{ fontSize: "22px", color: "#f7f2e8", fontWeight: 300 }}
          >
            {name}
          </h3>
          <p
            className="font-body mb-4"
            style={{ fontSize: "13px", color: "rgba(240,235,224,0.5)", fontWeight: 300, lineHeight: 1.75 }}
          >
            {description}
          </p>

          {/* Details */}
          <div className="flex gap-4 mb-5" style={{ fontSize: "11px", color: "rgba(240,235,224,0.4)" }}>
            <span className="font-body">🛏 {bedType}</span>
            <span className="font-body">👥 Hasta {maxGuests}</span>
          </div>

          {/* Price & CTA */}
          <div className="flex items-end justify-between mt-auto">
            <div>
              <span className="font-body" style={{ fontSize: "10px", color: "rgba(240,235,224,0.4)", letterSpacing: "1px", display: "block" }}>
                Desde
              </span>
              <span className="font-display" style={{ fontSize: "24px", color: "#c8a96e", fontWeight: 300 }}>
                ${price.toLocaleString("es-MX")}
                <span className="font-body" style={{ fontSize: "11px", color: "rgba(240,235,224,0.4)", fontWeight: 300 }}>
                  {" "}MXN/noche
                </span>
              </span>
            </div>
            <span
              className="font-body"
              style={{
                fontSize: "9px",
                fontWeight: 500,
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: "#c8a96e",
                borderBottom: "1px solid rgba(200,169,110,0.4)",
                paddingBottom: "2px",
              }}
            >
              Ver Suite →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
