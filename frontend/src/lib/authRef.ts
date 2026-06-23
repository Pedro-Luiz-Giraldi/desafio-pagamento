// Singleton bridge: allows api.ts to read AuthContext state without a circular import.
// AuthContext registers its functions here on mount.
export const authRef = {
  getToken: (): string | null => null,
  refresh: async (): Promise<boolean> => false,
  logout: async (): Promise<void> => {},
}
