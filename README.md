# Cannon Shooter - CS174A 3D Graphics Project

A 3D cannon shooting game built with Three.js that demonstrates interactive graphics, physics simulation, collision detection, and real-time shadowing.

## 🎮 Game Overview

Aim a ground-mounted cannon and fire spherical cannonballs at moving box targets. The player aims with the mouse, charges power by holding the mouse button, and fires on release. Hit targets to increase your score before the 60-second timer runs out!

## 🎯 CS174A Compliance

This project strictly follows CS174A requirements:

### Required Features
- **✅ Interactivity**: Mouse-based aiming (yaw/pitch control) and click-to-fire mechanics with keyboard restart
- **✅ 3D Graphics**: Uses Three.js for rendering, cameras, lighting, materials, and textures
- **✅ Transforms**: Hierarchical cannon structure with parent-child relationships for base/barrel rotation

### Advanced Features (3 Implemented)

1. **✅ Collision Detection**
   - Custom sphere vs AABB (Axis-Aligned Bounding Box) implementation
   - No external physics library used
   - See `src/collision.js`

2. **✅ Physics-Based Simulation**
   - Manual projectile motion with gravity (9.8 m/s²)
   - Kinematic integration: velocity and position updates
   - No external physics engine
   - See `src/projectile.js`

3. **✅ Shadowing**
   - Directional light with shadow mapping enabled
   - All objects cast and receive shadows
   - Configurable shadow map resolution (2048x2048)
   - See `src/scene.js`

### Technology Restrictions
- **✅ Three.js only**: Uses Three.js r160 with OrbitControls (allowed utility)
- **✅ No external libraries**: No physics engines, no game frameworks
- **✅ Pure ES modules**: No bundlers, runs directly in browser
- **✅ Basic HTML/CSS only**: Simple DOM overlays for HUD

## 🚀 Running the Game

### Quick Start
```bash
# Navigate to project directory
cd CannonShooter

# Start a local web server (Python 3)
python3 -m http.server 8000

# Or use Node.js
npx http-server -p 8000

# Open in browser
open http://localhost:8000/public/index.html
```

### Requirements
- Modern web browser with WebGL support (Chrome, Firefox, Safari, Edge)
- No build step required - runs directly in browser!

## 🎮 Controls

| Input | Action |
|-------|--------|
| **Mouse Move** | Aim cannon (yaw/pitch) |
| **Mouse Hold** | Charge power (0-100% over 1.5s) |
| **Mouse Release** | Fire projectile |
| **R Key** | Restart game |
| **Mouse Drag** | Orbit camera (OrbitControls) |
| **Mouse Wheel** | Zoom camera |

## 📁 Project Structure

```
CannonShooter/
├── public/
│   ├── index.html          # Main HTML entry point
│   ├── style.css           # HUD and overlay styles
│   └── assets/             # (Future: textures, models)
├── src/
│   ├── main.js             # Game loop and initialization
│   ├── scene.js            # Scene setup, lights, shadows
│   ├── cannon.js           # Cannon creation and aiming
│   ├── projectile.js       # Projectile physics and management
│   ├── targets.js          # Target spawning and animation
│   ├── collision.js        # Sphere vs AABB collision detection
│   ├── input.js            # Mouse/keyboard input handling
│   ├── hud.js              # HUD element management
│   └── utils.js            # Math utilities (clamp, lerp, etc.)
└── README.md               # This file
```

## 🔧 Technical Implementation

### Scene Setup (`scene.js`)
- **Camera**: Perspective camera with OrbitControls for 3rd-person view
- **Lights**:
  - Ambient light (0.4 intensity) for base illumination
  - Directional light (0.8 intensity) with shadow mapping
- **Ground**: Green plane with grid helper for depth perception
- **Fog**: Distance fog for atmospheric effect
- **Shadow Configuration**:
  - Shadow map size: 2048x2048
  - Shadow camera frustum: 100x100 units
  - PCF soft shadows for smooth edges

### Cannon Mechanics (`cannon.js`)
- **Hierarchical Structure**:
  - Base group (rotates on Y axis for yaw)
  - Barrel group (rotates on Z axis for pitch, child of base)
  - Primitive geometry: cylinders and boxes
- **Aiming Constraints**:
  - Pitch clamped to 5°-70° (prevents shooting backward or straight down)
  - Yaw restricted to ±90° (180° arc facing target area only)
  - Starts facing directly at blocks for intuitive aiming
- **World-Space Calculations**:
  - `getMuzzlePosition()`: Converts local barrel tip to world coordinates
  - `getFiringDirection()`: Gets normalized firing vector in world space

### Projectile Physics (`projectile.js`)
- **Physics Constants**:
  - Gravity: 9.8 m/s² downward
  - Max lifetime: 5 seconds
  - Radius: 0.3 units
- **Kinematic Integration**:
  ```javascript
  velocity += gravity * deltaTime
  position += velocity * deltaTime
  ```
- **Despawn Conditions**:
  - Below ground (y < -1)
  - Exceeded max lifetime
  - Collision with target

### Target System (`targets.js`)
- **8 Targets**: Placed at random lanes (x) and distances (z)
- **Movement**: At least 50% use ping-pong oscillation
- **Animation**:
  - Hit flash effect (color lerp to white)
  - Scale pulse on hit
  - 0.3s animation duration
- **Respawn**: New random position after hit

### Collision Detection (`collision.js`)
- **Algorithm**: Sphere vs AABB
  ```javascript
  1. Find closest point on box to sphere center
  2. Calculate distance from sphere center to closest point
  3. Collision if distance ≤ sphere radius
  ```
- **Performance**: O(n*m) where n=projectiles, m=targets (acceptable for small counts)
- **No physics engine**: Manual implementation per project requirements

### Input Handling (`input.js`)
- **Mouse Movement**: `mousemove` events track deltas for smooth aiming
- **Charging Mechanic**:
  - `mousedown`: Start timer
  - Interpolate charge from 0→1 over 1.5 seconds
  - `mouseup`: Fire with current charge
- **Power Scaling**: `speed = minPower + (maxPower - minPower) * charge`
- **Keyboard**: 'R' key for restart

### HUD System (`hud.js`)
- **Score Display**: Top-left, increments on hit
- **Timer Display**: Top-right, counts down from 60s
- **Power Bar**: Bottom-center, fills during charge
- **Game Over Screen**: Modal overlay with final score and restart button
- **Styling**: Semi-transparent backgrounds, gradient power bar

## 🎨 Visual Features

### Lighting & Materials
- **Standard PBR Materials**: All meshes use `MeshStandardMaterial`
- **Material Properties**:
  - Roughness: 0.6-0.8 (realistic surfaces)
  - Metalness: Varies by object (cannon more metallic than targets)
- **Color Coding**:
  - Cannon: Dark gray/blue (#2c3e50)
  - Targets: Random HSL colors (70% saturation, 50% lightness)
  - Projectiles: Dark gray (#333333)

### Shadow Quality
- **Shadow Mapping**: Enabled on renderer
- **Shadow Type**: PCF (Percentage Closer Filtering) soft shadows
- **Cast/Receive**:
  - Ground: Receives shadows only
  - Cannon, targets, projectiles: Cast and receive
- **Shadow Camera**: Orthographic, sized to cover play area

### Performance Optimizations
- **Geometry Reuse**: Single geometry per object type
- **Frustum Culling**: Automatic via Three.js
- **Shadow Map Caching**: Static light position
- **Delta Time**: Frame-rate independent physics

## 🎯 Gameplay Tuning

### Balanced Parameters
- **Power Range**: 10-40 units/second (tested for good arcs)
- **Charge Time**: 1.5 seconds for full charge
- **Target Count**: 8 (enough challenge without clutter)
- **Movement Speed**: 1-3 units/second (varied per target)
- **Game Duration**: 60 seconds (achievable skill ceiling)

### Difficulty Curve
- Moving targets harder to hit than static
- Distant targets require more arc/power
- Side-moving targets need leading

## 🧪 Testing & Validation

### Acceptance Tests (All Passing ✅)

1. **✅ Aiming**: Mouse movement updates cannon yaw/pitch smoothly, pitch clamped correctly
2. **✅ Charging & Firing**: Holding mouse charges power bar, releasing fires projectile with parabolic arc
3. **✅ Target Animation**: 8 targets present, 4+ oscillate smoothly left-right
4. **✅ Collision Detection**: Sphere-AABB collisions register reliably, score increments, targets respawn
5. **✅ Shadows**: All objects cast/receive shadows from directional light
6. **✅ Timer & Restart**: Timer counts 60→0, game over screen appears, restart works
7. **✅ Technology Compliance**: No external libraries beyond Three.js utilities, modular code structure

### Browser Compatibility
Tested in:
- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

## 📚 Learning Outcomes

This project demonstrates understanding of:
- **3D Graphics Pipeline**: Vertex transformations, rasterization, fragment shading
- **Hierarchical Transforms**: Parent-child relationships, local-to-world space
- **Lighting Models**: Ambient + directional lights, Phong/PBR materials
- **Shadow Mapping**: Depth textures, light-space rendering, PCF filtering
- **Physics Simulation**: Kinematic integration, gravity, projectile motion
- **Collision Detection**: Spatial data structures (implicit), geometric intersection tests
- **Game Architecture**: Separation of concerns, modular design, game loop patterns

## 🔮 Future Enhancements (Optional)

These features are **not required** for CS174A compliance but could be added:
- Wind simulation (velocity perturbation)
- Particle effects on hit
- Multiple cannon types
- Procedural terrain
- Audio effects
- Difficulty levels
- High score persistence

## 📝 Code Quality

- **Modular**: Each system in separate file
- **Documented**: JSDoc comments on all functions
- **Readable**: Clear variable names, consistent formatting
- **No Dependencies**: Runs without npm/build step
- **ES6+**: Modern JavaScript (modules, arrow functions, const/let)

## 🎓 Academic Integrity

This project is an original implementation for CS174A. All code written from scratch except:
- Three.js library (allowed)
- OrbitControls (allowed utility)
- Basic HTML/CSS structure

No tutorials, templates, or external codebases were used. All algorithms implemented manually per project requirements.

**Enjoy the game! 🎯🎮**

