"use client";

// The registration CTA previously lived here as a sticky bottom bar.
// It has been inlined into RegistrationPanel so the button sits at the
// bottom of the dashboard content instead. This component is kept as a
// no-op so the (app) and (admin) layouts don't need to be edited every
// time we toggle the bottom nav pattern.
export function MobileNav() {
  return null;
}
