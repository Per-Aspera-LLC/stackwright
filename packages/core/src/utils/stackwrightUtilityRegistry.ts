import { StackwrightUtilities } from '../interfaces/stackwright-utilities';

class StackwrightUtilityRegistryImpl {
  private utilities: Partial<StackwrightUtilities> = {};

  register(utilities: Partial<StackwrightUtilities>): void {
    this.utilities = { ...this.utilities, ...utilities };
  }

  get<K extends keyof StackwrightUtilities>(utilityName: K): StackwrightUtilities[K] {
    const utility = this.utilities[utilityName];
    if (!utility) {
      throw new Error(
        `Stackwright utility '${String(utilityName)}' is not registered. ` +
          `Please register it using stackwrightUtilityRegistry.register() before use.`
      );
    }
    return utility as StackwrightUtilities[K];
  }

  isRegistered(utilityName: keyof StackwrightUtilities): boolean {
    return !!this.utilities[utilityName];
  }

  // Debug helper
  getRegisteredUtilities(): string[] {
    return Object.keys(this.utilities);
  }

  // Clear all registrations (useful for testing)
  clear(): void {
    this.utilities = {};
  }
}

// Singleton instance
export const stackwrightUtilityRegistry = new StackwrightUtilityRegistryImpl();

// Convenience functions for easier access
export const getStackwrightStaticGeneration = () =>
  stackwrightUtilityRegistry.get('StaticGeneration');

// Helper to register utilities with validation
export function registerStackwrightUtilities(utilities: Partial<StackwrightUtilities>) {
  stackwrightUtilityRegistry.register(utilities);
}
