interface PowerRollDialogModifiers {
  edges: number;
  banes: number;
  bonuses: number;
  ability?: string;
  target?: string;
}

export interface PowerRollDialogPrompt {
  rolls: PowerRollDialogModifiers[];
  rollMode: keyof typeof CONFIG["Dice"]["rollModes"];
  damage?: string;
}
