import "./actor/_types";
import "./advancement/_types";
import "./combat/_types";
import "./combatant/_types";
import "./combatant-group/_types";
import "./effect/_types";
import "./item/_types";
import "./message/_types";
import "./models/_types";
import "./settings/_types";

export type BarAttribute = {
  value: number,
  max: number
}

export type SubtypeMetadata = {
  /* Record of document names of pseudo-documents and the path to the collection. */
  embedded: Record<string, string>
}
