// The six scenes and their differences. Coordinates are in image space: x and y run
// 0..1000 across the 1280x800 scene picture, r is the click radius in the same units.
// Each difference names what changed between the left (original) and right pictures and
// how it changed: removed, recoloured, moved or resized. Every scene hides exactly 8,
// spread over the whole frame so no corner is safe to skip.

export const SCENES = [
  {
    id: 'harbour',
    title: 'Harbour at Dawn',
    tagline: 'A sleepy quay, a striped lighthouse, and a sun that changed its mind.',
    imageA: 'assets/scene1-a.jpg',
    imageB: 'assets/scene1-b.jpg',
    differences: [
      { x: 885, y: 165, r: 58, label: 'The sun turned orange', kind: 'recoloured' },
      { x: 495, y: 240, r: 42, label: 'A seagull flew away', kind: 'removed' },
      { x: 395, y: 460, r: 46, label: 'The blue roof turned pink', kind: 'recoloured' },
      { x: 835, y: 685, r: 48, label: 'The green rowing boat is gone', kind: 'removed' },
      { x: 555, y: 940, r: 36, label: 'The orange fish swam off', kind: 'removed' },
      { x: 245, y: 845, r: 42, label: 'The barrel vanished', kind: 'removed' },
      { x: 340, y: 620, r: 52, label: 'The red sail turned yellow', kind: 'recoloured' },
      { x: 195, y: 95, r: 46, label: 'A cloud drifted away', kind: 'removed' },
    ],
  },
  {
    id: 'market',
    title: 'Lantern Night Market',
    tagline: 'Paper lanterns, fruit stalls, and a cat that slipped away.',
    imageA: 'assets/scene2-a.jpg',
    imageB: 'assets/scene2-b.jpg',
    differences: [
      { x: 755, y: 115, r: 56, label: 'The moon went out', kind: 'removed' },
      { x: 595, y: 790, r: 46, label: 'The ginger cat is gone', kind: 'removed' },
      { x: 85, y: 870, r: 56, label: 'The bicycle rode off', kind: 'removed' },
      { x: 70, y: 125, r: 40, label: 'A red lantern turned yellow', kind: 'recoloured' },
      { x: 330, y: 835, r: 42, label: 'The teapot disappeared', kind: 'removed' },
      { x: 845, y: 450, r: 56, label: 'The red banner turned green', kind: 'recoloured' },
      { x: 425, y: 885, r: 46, label: 'Oranges became apples', kind: 'recoloured' },
      { x: 500, y: 555, r: 56, label: 'The yellow awning turned red', kind: 'recoloured' },
    ],
  },
  {
    id: 'library',
    title: 'The Cozy Library',
    tagline: 'Shelves of books, a sleeping cat, and a clock that jumped ahead.',
    imageA: 'assets/scene3-a.jpg',
    imageB: 'assets/scene3-b.jpg',
    differences: [
      { x: 610, y: 116, r: 46, label: 'The clock jumped to nine', kind: 'moved' },
      { x: 815, y: 164, r: 46, label: 'The moon grew full', kind: 'recoloured' },
      { x: 515, y: 879, r: 56, label: 'The cat left the rug', kind: 'removed' },
      { x: 705, y: 633, r: 46, label: 'The teapot turned red', kind: 'recoloured' },
      { x: 815, y: 559, r: 50, label: 'The plant is gone', kind: 'removed' },
      { x: 410, y: 649, r: 50, label: 'The cushion lost its stripes', kind: 'recoloured' },
      { x: 930, y: 836, r: 40, label: 'A book left the stack', kind: 'removed' },
      { x: 565, y: 335, r: 50, label: 'The lamp shade turned orange', kind: 'recoloured' },
    ],
  },
  {
    id: 'cabin',
    title: 'Mountain Cabin Winter',
    tagline: 'Snow, a snowman, and a deer that wandered off.',
    imageA: 'assets/scene4-a.jpg',
    imageB: 'assets/scene4-b.jpg',
    differences: [
      { x: 835, y: 110, r: 42, label: 'The moon melted away', kind: 'removed' },
      { x: 500, y: 635, r: 36, label: 'The scarf turned blue', kind: 'recoloured' },
      { x: 855, y: 855, r: 52, label: 'The deer wandered off', kind: 'removed' },
      { x: 555, y: 825, r: 40, label: 'A duck flew away', kind: 'removed' },
      { x: 835, y: 665, r: 56, label: 'The red sled turned blue', kind: 'recoloured' },
      { x: 905, y: 575, r: 40, label: 'The lantern went dark', kind: 'recoloured' },
      { x: 540, y: 180, r: 60, label: 'The chimney smoke is gone', kind: 'removed' },
      { x: 575, y: 660, r: 42, label: 'A snowy bush vanished', kind: 'removed' },
    ],
  },
  {
    id: 'park',
    title: 'Sunny Park Picnic',
    tagline: 'A kite, a patient dog, and a butterfly that did not stay.',
    imageA: 'assets/scene5-a.jpg',
    imageB: 'assets/scene5-b.jpg',
    differences: [
      { x: 620, y: 135, r: 56, label: 'The red kite turned yellow', kind: 'recoloured' },
      { x: 445, y: 855, r: 36, label: 'The butterfly flew off', kind: 'removed' },
      { x: 375, y: 645, r: 30, label: "The dog's collar turned blue", kind: 'recoloured' },
      { x: 755, y: 725, r: 40, label: 'A duck paddled away', kind: 'removed' },
      { x: 285, y: 725, r: 36, label: 'The bottle is gone', kind: 'removed' },
      { x: 215, y: 765, r: 30, label: 'An apple was eaten', kind: 'removed' },
      { x: 445, y: 245, r: 46, label: 'A cloud drifted away', kind: 'removed' },
      { x: 70, y: 565, r: 40, label: 'A bush by the bench is gone', kind: 'removed' },
    ],
  },
  {
    id: 'space',
    title: 'Space Station Window',
    tagline: 'Earth through the porthole, and a toolbox that floated away.',
    imageA: 'assets/scene6-a.jpg',
    imageB: 'assets/scene6-b.jpg',
    differences: [
      { x: 845, y: 315, r: 42, label: 'The moon slipped away', kind: 'removed' },
      { x: 420, y: 425, r: 46, label: 'The suit patches turned to stars', kind: 'recoloured' },
      { x: 215, y: 475, r: 46, label: 'The plant floated off', kind: 'removed' },
      { x: 450, y: 715, r: 46, label: 'The coffee pouch drifted away', kind: 'removed' },
      { x: 85, y: 745, r: 52, label: 'The fire extinguisher is gone', kind: 'removed' },
      { x: 495, y: 205, r: 40, label: 'The toolbox floated off', kind: 'removed' },
      { x: 720, y: 610, r: 46, label: 'The storm swirl faded', kind: 'removed' },
      { x: 490, y: 780, r: 40, label: 'A vent grille vanished', kind: 'removed' },
    ],
  },
];

/** Total differences across the whole hunt. */
export const TOTAL_DIFFERENCES = SCENES.reduce((sum, scene) => sum + scene.differences.length, 0);
