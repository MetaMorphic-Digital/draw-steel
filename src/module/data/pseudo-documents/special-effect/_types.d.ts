export {}

declare module "./base-special-effect.mjs" {
  export default interface BaseSpecialEffect {
    description: string;
    before: boolean;
  }
}

declare module "./spend-effect.mjs" {
  export default interface BaseSpecialEffect {
    resource: {
      value: number;
      multiple: boolean;
    }
  }
}
