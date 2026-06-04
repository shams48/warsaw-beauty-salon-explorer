// Minimal typings for the `opening_hours` npm package (used client-side only).
declare module "opening_hours" {
  export default class OpeningHours {
    constructor(value: string, nominatimObject?: unknown, optionalConf?: unknown)
    getState(date?: Date): boolean
    getNextChange(date?: Date): Date | undefined
  }
}
