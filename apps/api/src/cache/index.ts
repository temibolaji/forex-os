export const redis = {
  get: async (key: string) => null,
  set: async (key: string, value: string, mode?: string, duration?: number) => 'OK',
  del: async (key: string) => 1,
  on: (event: string, callback: any) => {},
};
