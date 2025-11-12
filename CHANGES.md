# Aiming Improvement Changes

## Problem
The original implementation allowed the cannon to rotate a full 360 degrees, making it difficult to aim at the target blocks since the player could accidentally aim in the wrong direction.

## Solution
Restricted the cannon's yaw rotation to a 180-degree arc that only faces toward the target area.

## Changes Made

### 1. Input System (`src/input.js`)
- **Added yaw constraints**:
  - `MIN_YAW = -Math.PI / 2` (-90 degrees)
  - `MAX_YAW = Math.PI / 2` (+90 degrees)
- **Modified `onMouseMove()`**: Added yaw clamping to restrict horizontal rotation
- **Initial yaw**: Set to 0 radians (facing -Z direction where blocks are located)

### 2. Camera Setup (`src/scene.js`)
- **Camera position**: Changed from `(0, 8, 15)` to `(0, 8, 12)` for better view
- **Camera look-at**: Changed from `(0, 2, 0)` to `(0, 2, -10)` to face block area
- **OrbitControls target**: Updated to `(0, 2, -10)` to focus on gameplay area

## Result
✅ Cannon starts facing directly at the blocks
✅ Cannon can only rotate left/right within target area (180° arc)
✅ Much more intuitive and easier to aim
✅ Camera provides optimal view of both cannon and targets
✅ No more confusion about which direction to aim

## Technical Details

The blocks spawn at:
- X: Random between -15 and 15
- Z: Random between -30 and -10 (negative Z is forward)

The cannon is at origin (0, 0, 0), so:
- Yaw = 0 means facing -Z (straight at blocks)
- Yaw = -π/2 means facing +X (right edge of block area)
- Yaw = +π/2 means facing -X (left edge of block area)

This 180° restriction ensures the cannon always faces somewhere within the block spawning area, making gameplay much more user-friendly while maintaining full coverage of the target zone.

