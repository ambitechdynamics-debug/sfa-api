/**
 * Stripe v22 ships its types via `exports.types`, but its npm tarball at the
 * time of writing OMITS the top-level `stripe.cjs.node.d.ts` file referenced
 * by that field — so neither `moduleResolution: Node` nor `Node16` can find
 * it. This ambient declaration unblocks `tsc` everywhere (local + Render
 * Docker) by declaring the module as `any`.
 *
 * Trade-off: no compile-time type checking on Stripe API usage. We mitigate
 * this with runtime tests and the `as any` casts already present at the
 * single call site (src/config/stripe.ts).
 *
 * To restore proper typing once Stripe publishes a fixed tarball, delete this
 * file — TS will pick up the real declarations automatically.
 */
declare module 'stripe' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Stripe: any;
  export = Stripe;
  export default Stripe;
}
