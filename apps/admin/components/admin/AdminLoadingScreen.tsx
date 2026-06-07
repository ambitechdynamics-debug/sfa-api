import { ConsiliumPrismLogo } from "@/components/brand/ConsiliumPrismLogo"

export function AdminLoadingScreen() {
  return (
    <div className="csl-admin-loading" role="status" aria-live="polite">
      <div className="csl-admin-loading-inner">
        <ConsiliumPrismLogo size={72} className="csl-admin-loader-logo" />
        <div className="csl-admin-loader-line" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  )
}
