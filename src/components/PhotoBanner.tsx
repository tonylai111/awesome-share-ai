const images = [
  { src: "/life/banner-1.jpg" },
  { src: "/life/banner-2.jpg" },
  { src: "/life/banner-3.jpg" },
  { src: "/life/banner-4.jpg" },
];

export function PhotoBanner({ label }: { label: string }) {
  return (
    <div className="photo-banner" role="region" aria-label={label}>
      <div className="photo-banner-track">
        {[0, 1].map((group) => (
          <div
            className="photo-banner-group"
            key={group}
            aria-hidden={group === 1}
          >
            {images.map((image, index) => (
              <figure
                className="photo-banner-item"
                key={`${group}-${index}`}
              >
                <img src={image.src} alt="" loading="lazy" />
              </figure>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
