export const systemID = "draw-steel";
/**
 * Translates repository paths to Foundry Data paths
 * @param {string} path - A path relative to the root of this repository
 * @returns {string} The path relative to the Foundry data folder
 */
export const systemPath = (path) => `systems/${systemID}/${path}`;
export const ASCII = `
______                      _____ _            _
|  _  \\                    /  ___| |          | |
| | | |_ __ __ ___      __ \\ \`--.| |_ ___  ___| |
| | | | '__/ _\` \\ \\ /\\ / /  \`--. \\ __/ _ \\/ _ \\ |
| |/ /| | | (_| |\\ V  V /  /\\__/ / ||  __/  __/ |
|___/ |_|  \\__,_| \\_/\\_/   \\____/ \\__\\___|\\___|_|
`;
