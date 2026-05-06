# FarmCraft – Game Design Document

## 1. Game Overview

**Name:** FarmCraft (working title)

**Genre:** 2D Sandbox Farming Game

**Core Idea:**
A 2D Minecraft-style game where the player explores terrain, builds a farm, grows crops, manages resources, and expands over time.

---

## 2. Core Gameplay Loop

1. Explore terrain
2. Prepare land (convert to farmland)
3. Plant crops
4. Wait for crops to grow
5. Harvest crops
6. Gain resources (wheat, etc.)
7. Expand farm
8. Repeat

**Design Rule:**
Every feature must support or enhance this loop.

---

## 3. Player

### Representation

* Player is a **chicken character**

### Abilities

* Move left/right (A/D)
* Jump (Space)

### Constraints

* Cannot overlap with solid blocks
* Cannot place blocks inside player

---

## 4. World

### Structure

* Tile-based grid
* Side-scrolling
* Large horizontal world

### Block Types

* Air
* Grass
* Dirt
* Stone
* Water
* Farmland

### Rules

* Grass/Dirt → can be converted into farmland
* Blocks can be placed and broken
* World scrolls with player movement (camera system)

---

## 5. Farming System

### Farmland

* Created by placing farmland block

### Crop Lifecycle

| Stage | Description               |
| ----- | ------------------------- |
| 0     | No crop                   |
| 1     | Small sprout              |
| 2     | Medium growth             |
| 3     | Tall crop                 |
| 4     | Fully grown (harvestable) |

### Growth Rules

* Crops grow over time
* Growth speed:

  * Faster during day
  * Slower at night
  * Faster near water (future enhancement)

---

## 6. Harvest System

### Rule

* Only fully grown crops can be harvested

### Action

* Player interacts (click/key)

### Result

* Crop removed
* Player gains resource

---

## 7. Inventory System

### Initial Structure

```
inventory = {
  wheat: 0
}
```

### Rules

* Harvesting crops increases wheat count
* Inventory displayed on UI

---

## 8. Economy & Progression

### Resources

* Wheat (primary)

### Usage

* Unlock new blocks
* Improve farming speed
* Unlock animals

### Example Progression

* 10 wheat → improved farmland
* 20 wheat → unlock animals

---

## 9. Animals

### Initial Behavior

* Move randomly
* Affected by gravity
* Walk on terrain

### Future Behavior

* Chickens lay eggs over time
* Eggs become secondary resource

---

## 10. Day/Night Cycle

### System

* Continuous time loop

### Effects

| Time  | Effect                        |
| ----- | ----------------------------- |
| Day   | Faster crop growth            |
| Night | Slower growth + darker screen |

---

## 11. Camera System

### Behavior

* Follows player horizontally
* Keeps player near center of screen

### Constraints

* Cannot scroll beyond world boundaries

---

## 12. Controls

| Action       | Key         |
| ------------ | ----------- |
| Move Left    | A           |
| Move Right   | D           |
| Jump         | Space       |
| Select Block | 1–5         |
| Place Block  | Left Click  |
| Break Block  | Right Click |

---

## 13. User Interface

### Layout

* Top-left: Resource display

  * Wheat count
  * (Future: eggs, coins)

* Bottom: Hotbar

  * Block selection (1–5)

* Overlay:

  * Day/Night indicator

---

## 14. Visual Style

* Pixel-style blocks
* Bright, simple colors
* Minimalistic shapes (no complex sprites required)

---

## 15. Game Goal

### Version 1 Goal

* Collect 100 wheat

### Version 2 Goal

* Expand farm area

### Version 3 Goal

* Unlock all upgrades

---

## 16. Future Enhancements (Not Immediate)

* Water-based irrigation system
* Animal resource system (eggs, milk, etc.)
* Inventory UI expansion
* Save/load game
* Infinite terrain generation
* Weather system

---

## 17. Design Principles

* Keep mechanics simple and clear
* Prioritize gameplay loop over features
* Avoid unnecessary complexity
* Build incrementally
* Every addition must improve player experience

---

## 18. Current Status

### Implemented

* Player movement and physics
* Terrain generation
* Block placement and breaking
* Camera scrolling
* Basic farming system (growth)
* Day/Night cycle
* Animals (basic movement)

### Missing (Next Priority)

* Harvest interaction
* Inventory tracking
* Resource display
* Gameplay progression

---

## 19. Next Steps

1. Implement crop harvesting
2. Add inventory system (wheat count)
3. Display resources on UI
4. Link farming to progression

---

# End of Document

---

## What you just did (important)

You now have:

* A **real game definition**
* A **clear scope**
* A **roadmap**

Most people skip this → that’s why their projects die.

---
