class Player {
  color;
  deathInProgress;
  direction;
  fireRange;
  id;
  index;
  lives;
  maxBombs;
  plantedBombs;
  name;
  phase;
  position;
  powerup;
  role;

  // Underscore necessary to distinguish this field from `color` so as to avoid infinite loop while setting initial value. So say's GitHub Copilot. It didn't seem to get stuck, but it did lead to problems.
  set _color(color) {
    this.color = color;
    this.role = characters[color];
  }

  constructor(index, socket) {
    this.deathInProgress = false;
    this.direction = { y: 0, x: 0, key: "" };
    this.fireRange = 1;
    this.id = socket.id;
    this.index = index;
    this.initialPosition = {
      y: 1 + 10 * ((index & 2) >> 1),
      x: 1 + 12 * (index & 1),
    };
    this.maxBombs = 1;
    this.plantedBombs = 0;
    this.lives = 3;
    this.phase = "start";
    this.position = {
      y: 1 + 10 * ((index & 2) >> 1),
      x: 1 + 12 * (index & 1),
    };
    switch (index) {
      case 0:
        this.initialPosition = { y: 1, x: 1 };
        break;
      case 1:
        this.initialPosition = { y: 11, x: 13 };
        break;
      case 2:
        this.initialPosition = { y: 11, x: 1 };
        break;
      case 3:
        this.initialPosition = { y: 1, x: 13 };
        break;
    }
    this.powerup = null;
  }
}

const characters = {
  gray: "Old Nickle",
  black: "Blackleg",
  silver: "Silver Bullet",
  white: "Ghost",
  pink: "Shocking Pink",
  magenta: "Not So Magentle",
  purple: "Purple with Rage",
  blue: "Mad Bomber",
  darkblue: "Livid",
  cyan: "Cyanide",
  green: "The Green Reaper",
  yellow: "Furious Yellow",
  gold: "Golden Age",
  orange: "Unhinged Orange",
  brown: "Brown Bess",
  red: "Red Salamander",
};

module.exports = Player;
