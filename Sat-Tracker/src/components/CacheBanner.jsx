export default function CacheBanner({ banner, onClear }) {
  if (!banner) return null
  return (
    <div id="cache-banner" className="show">
      <span id="cache-banner-text">{banner.text}</span>
      <span id="clear-cache-btn" onClick={onClear}>clear &amp; refetch</span>
    </div>
  )
}
