export default function HeroAvatar({
  poster = '/avatar.jpg',
  opacity = 0.92,
}) {
  if (!poster) return null

  return (
    <div className="scene" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- global static background must preserve the existing raw-img rendering */}
      <img
        src={poster}
        alt=""
        className="bg-video"
        aria-hidden="true"
        draggable={false}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        style={{
          opacity,
          position: 'absolute',
          inset: 0,
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  )
}