
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
    revision: number;
    bookPlaceHolder: string;
    label: string;
    value: string;
    slug: string;
  }
}
