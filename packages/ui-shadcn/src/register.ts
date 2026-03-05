// registerShadcnComponents is a no-op for now — the shadcn components are used
// directly by @stackwright/core components. This function exists for forward
// compatibility and signals to app entry points that the adapter is active.
//
// Future: if a UI primitive registry is added to @stackwright/core,
// this will register Button, Tabs, Accordion etc. into it.

export function registerShadcnComponents(): void {
  // intentionally empty — components are imported directly
}
