"use client";

import { useState } from "react";
import Image from "next/image";

type PosterImageProps = {
  src: string;
  alt: string;
  label: string;
  priority?: boolean;
  sizes: string;
  objectPosition?: string;
  showLabel?: boolean;
};

export function PosterImage({
  src,
  alt,
  label,
  priority = false,
  sizes,
  objectPosition = "center top",
  showLabel = true,
}: PosterImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <>
      <style jsx>{`
        .poster-fallback {
          position: absolute;
          inset: 0;
          display: grid;
          align-content: end;
          padding: var(--space-4);
          background:
            linear-gradient(150deg, rgba(246, 196, 107, 0.28), transparent 34%),
            linear-gradient(330deg, rgba(77, 212, 189, 0.24), transparent 42%),
            linear-gradient(180deg, #1a1e2c 0%, #090b12 100%);
          color: var(--text);
          font-size: 18px;
          font-weight: 900;
          line-height: 1.08;
        }

        .poster-fallback::before {
          content: "";
          position: absolute;
          inset: var(--space-3);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: inherit;
        }

        .poster-label {
          position: relative;
          z-index: 1;
          text-wrap: balance;
        }
      `}</style>

      {failed ? (
        <div className="poster-fallback" role="img" aria-label={alt}>
          {showLabel ? <div className="poster-label">{label}</div> : null}
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          unoptimized
          onError={() => setFailed(true)}
          style={{ objectFit: "cover", objectPosition }}
          priority={priority}
        />
      )}
    </>
  );
}
