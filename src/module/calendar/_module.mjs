/** 
 * Orden Calendar 
 * Unofficial, community-sourced calendar definition. 
 * 
 * Source: 
 * https://docs.google.com/spreadsheets/d/1wYMqJCDY mexxGFybdDGMCMvlPxTFKMwJOKEVpznfFlQ 
 */  
export const ORDEN_CALENDAR = { 
    id: "orden", 
    label: "Orden", 
    description: "Unofficial Orden calendar for Draw Steel.", 

    // Days of the week
  weekdays: [
    { id: "lain", label: "Lain" },
    { id: "dulain", label: "Dulain" },
    { id: "disarth", label: "Disarth" },
    { id: "mart", label: "Mart" },
    { id: "cetain", label: "Cetain" },
    { id: "disadane", label: "Disadane" },
    { id: "dardone", label: "Dardone" },
  ],

  // Months of the year
  months: [
    { id: "bleaker", label: "Bleaker", days: 28 },
    { id: "malice", label: "Malice", days: 28 },
    { id: "nox", label: "Nox", days: 28 },
    { id: "aster", label: "Aster", days: 28 },
    { id: "beltene", label: "Beltene", days: 28 },
    { id: "heather", label: "Heather", days: 28 },
    { id: "lyleth", label: "Lyleth", days: 28 },
    { id: "cullwen", label: "Cullwen", days: 28 },
    { id: "sapir", label: "Sapir", days: 28 },
    { id:"rutter", label: "Rutter", days: 28 },
    { id: "aniss", label: "Aniss", days: 28 },
    { id: "whisten", label: "Whisten", days: 28 },
    { id: "fasting", label: "Fasting", days: 28 },
    { id: "yearsend", label: "Year's End", days: 1 },
  ],

  // Year configuration unofficially starts Year 342 of the Age of Conquest
  startingYear: 342,
};