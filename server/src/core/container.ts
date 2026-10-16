/**
 * Lightweight Type-Safe Dependency Injection Container.
 * Conforms to Node.js Advanced Patterns (DI Container).
 */

export class Container {
  private factories = new Map<string, () => unknown>();
  private singletons = new Map<string, unknown>();

  /**
   * Registers a transient factory that instantiates a new instance per resolve.
   */
  register<T>(key: string, factory: () => T): void {
    this.factories.set(key, factory);
    this.singletons.delete(key);
  }

  /**
   * Registers a singleton service that is lazily instantiated on first resolve and cached.
   */
  singleton<T>(key: string, factory: () => T): void {
    this.factories.set(key, () => {
      if (!this.singletons.has(key)) {
        this.singletons.set(key, factory());
      }
      return this.singletons.get(key) as T;
    });
  }

  /**
   * Resolves a dependency by key. Throws if unregistered.
   */
  resolve<T>(key: string): T {
    const factory = this.factories.get(key);
    if (!factory) {
      throw new Error(`[DI Container] No dependency registered for key: "${key}"`);
    }
    return factory() as T;
  }

  /**
   * Checks if a dependency is registered.
   */
  has(key: string): boolean {
    return this.factories.has(key);
  }

  /**
   * Resets all registrations and instances (useful for testing).
   */
  clear(): void {
    this.factories.clear();
    this.singletons.clear();
  }
}

export const container = new Container();
