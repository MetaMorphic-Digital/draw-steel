export {};

declare module "./object-size.mjs" {
  export default interface ObjectSizeModel {
    text: string;
    direction: string;
    typical: string;
    shapes: Array<typeof foundry.data.BaseShapeData.TYPES[keyof typeof foundry.data.BaseShapeData.TYPES]>;
  }
}

declare module "./size.mjs" {
  export default interface SizeModel {
    value: number;
    letter: string | null;
  }
}

declare module "./source.mjs" {
  export default interface SourceModel {
    book: string;
    page: string;
    license: string;
    label: string;
  }
}
