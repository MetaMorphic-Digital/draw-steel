import { BarAttribute } from "../_types";

declare module "./base.mjs" {
  interface BaseActorModel {
    stamina: BarAttribute,
    characteristics: {
      mgt: {
        value: number;
      },
      agl: {
        value: number;
      },
      rea: {
        value: number;
      },
      inu: {
        value: number;
      },
      prs: {
        value: number;
      }
    }
  }
}
