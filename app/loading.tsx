export default function Loading() {
  return (
    <main className="loading-page" aria-busy="true" aria-label="Loading the NORTHLINE storefront">
      <div className="loading-brand">NORTHLINE<span>®</span></div>
      <div className="loading-hero liquid-glass glass-smoked"><span className="loading-label">SETTING OUT</span><div className="loading-line" /><div className="loading-line short" /></div>
      <div className="loading-products" aria-hidden="true">{[1, 2, 3, 4].map((item) => <div className="loading-product liquid-glass glass-frosted" key={item}><div className="loading-image" /><div className="loading-line" /><div className="loading-line short" /></div>)}</div>
      <span className="sr-only">Loading the latest from NORTHLINE.</span>
    </main>
  )
}
