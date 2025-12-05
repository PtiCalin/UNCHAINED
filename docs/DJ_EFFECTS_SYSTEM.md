# DJ Effect Library System

## Overview

UNCHAINED includes a comprehensive effect library system for DJ mixing with 18+ professional effects across 7 categories. The system supports real-time parameter adjustment, effect chains per deck, and preset management with factory and custom presets.

## Effect Categories

### EQ
- **3-Band EQ**: Classic equalizer with low, mid, and high frequency bands

### Filter
- **High Pass Filter**: Remove low frequencies below cutoff
- **Low Pass Filter**: Remove high frequencies above cutoff  
- **Band Pass Filter**: Allow specific frequency band to pass

### Space
- **Reverb**: Add spatial depth and ambience with room size, damping, and pre-delay controls

### Time
- **Delay**: Time-based echo with BPM sync and note values (1/4, 1/8, 1/16)
- **Echo**: Multi-tap delay with ping-pong and modulation

### Drive
- **Distortion**: Harmonic saturation (warm, hard, fuzzy, tube modes)
- **Bitcrusher**: Digital distortion via bit depth and sample rate reduction

### Modulation
- **Phaser**: Phase shifting with adjustable stages (2, 4, 6, 8)
- **Flanger**: Sweeping comb filter effect
- **Chorus**: Thickens sound with detuned copies
- **Auto Pan**: Automatic stereo panning
- **Tremolo**: Amplitude modulation

### Dynamics
- **Compressor**: Reduce dynamic range with threshold, ratio, attack, release
- **Limiter**: Prevent signal from exceeding threshold
- **Gate**: Silence signal below threshold

### Special
- **Vocoder**: Robot voice effect
- **Ring Modulator**: Metallic, bell-like tones

## Factory Presets

### EQ
- **Club EQ Boost**: Enhanced bass and treble for club sound (+3dB low, +2dB high)

### Filter
- **Radio Filter**: Vintage radio sound (bandpass at 1.5kHz)

### Space
- **Big Room Reverb**: Large hall reverb (0.9 room size, 0.4 wet mix)

### Time
- **1/4 Note Delay**: Quarter note synced delay (0.4 feedback)

### Drive
- **Dirty Drop**: Heavy distortion for drops (0.8 drive, hard mode)
- **Lo-Fi Crush**: 8-bit video game sound (8-bit depth, 8kHz sample rate)

### Modulation
- **Psychedelic Phase**: Deep phasing sweep (8 stages, 0.8 depth)
- **Flanged Out**: Intense flanging (0.7 feedback, 0.6 mix)

### Dynamics
- **Pump & Drive**: Compression + distortion combo

## Backend Architecture

### Database Schema

#### `effects` table
```sql
CREATE TABLE effects (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    category TEXT,
    description TEXT,
    default_params_json TEXT,
    created_at TEXT
)
```

#### `fx_presets` table
```sql
CREATE TABLE fx_presets (
    id INTEGER PRIMARY KEY,
    name TEXT,
    description TEXT,
    category TEXT,
    effects_json TEXT,  -- JSON array of effects with params
    is_factory INTEGER DEFAULT 0,
    created_at TEXT
)
```

#### `effect_chains` table
```sql
CREATE TABLE effect_chains (
    id INTEGER PRIMARY KEY,
    deck_id TEXT,
    slot INTEGER,
    effect_id INTEGER,
    params_json TEXT,
    enabled INTEGER DEFAULT 1,
    wet_dry REAL DEFAULT 0.5,
    created_at TEXT
)
```

### Service Layer

**File**: `backend/app/services/effect_service.py`

Key functions:
- `initialize_effect_library()`: Populate database with built-in effects
- `list_effects(category?)`: Get all effects, optionally filtered
- `get_effect_categories()`: List available categories
- `list_fx_presets_enhanced(category?)`: Get presets with details
- `add_fx_preset_enhanced()`: Create custom preset
- `update_fx_preset()`: Modify custom preset (factory presets locked)
- `get_deck_effect_chain(deck_id)`: Get active effects for deck
- `add_effect_to_chain()`: Add effect to deck at slot
- `update_effect_params()`: Change effect parameters/wet-dry/enabled
- `remove_effect_from_chain()`: Remove effect from deck
- `clear_deck_effects()`: Remove all effects from deck
- `apply_preset_to_deck()`: Load preset chain to deck

## REST API

### Effects

**GET** `/dj/effects?category={category}`
- List all available effects
- Optional category filter

**GET** `/dj/effects/categories`
- Get list of effect categories

### Presets

**GET** `/dj/fx-presets/enhanced?category={category}`
- List all presets with full details
- Optional category filter

**POST** `/dj/fx-presets/enhanced`
```json
{
  "name": "My Preset",
  "description": "Custom effect chain",
  "category": "Custom",
  "effects_json": "[{\"effect_id\": \"reverb\", \"params\": {...}, \"wet_dry\": 0.5}]"
}
```

**PUT** `/dj/fx-presets/{preset_id}`
- Update custom preset (cannot modify factory presets)

**DELETE** `/dj/fx-presets/{preset_id}`
- Delete custom preset

### Deck Effect Chains

**GET** `/dj/decks/{deck_id}/effects`
- Get active effect chain for deck

**POST** `/dj/decks/{deck_id}/effects`
```json
{
  "effect_name": "Reverb",
  "slot": 0,
  "params_json": "{\"room_size\": 0.7}",
  "wet_dry": 0.5
}
```

**PUT** `/dj/decks/effects/{chain_id}`
```json
{
  "params_json": "{\"room_size\": 0.9}",
  "wet_dry": 0.6,
  "enabled": true
}
```

**DELETE** `/dj/decks/effects/{chain_id}`
- Remove effect from chain

**DELETE** `/dj/decks/{deck_id}/effects`
- Clear all effects from deck

**POST** `/dj/decks/{deck_id}/apply-preset/{preset_id}`
- Apply preset's effect chain to deck

## Frontend Components

### EffectLibrary
**File**: `frontend/src/components/dj/EffectLibrary.tsx`

Browse and select effects by category. Displays all available effects with descriptions and categories.

Props:
- `onSelectEffect(effect: Effect)`: Callback when effect is selected

### EffectUnit
**File**: `frontend/src/components/dj/EffectUnit.tsx`

Individual effect control with:
- Enable/disable toggle
- Wet/Dry mix slider
- Expandable parameter controls
- Remove button

Props:
- `effect: EffectChainItem`: Effect data
- `onUpdate()`: Callback after changes

### EffectRack
**File**: `frontend/src/components/dj/EffectRack.tsx`

Complete effect management for a deck:
- View active effect chain
- Add effects from library
- Apply presets
- Clear all effects
- Manages slots and ordering

Props:
- `deckId: string`: Target deck ('A', 'B', etc.)

### DeckPanel
**File**: `frontend/src/components/dj/DeckPanel.tsx`

Full deck control including:
- Transport controls (play/pause)
- Tempo/pitch/key shift sliders
- Quantize and key lock toggles
- Integrated effect rack (collapsible)
- BPM/key display

### Mixer
**File**: `frontend/src/components/dj/Mixer.tsx`

Central mixer with:
- Master volume control
- Per-deck volume and 3-band EQ
- Crossfader (A ↔ B)
- VU meters (placeholder)

## Frontend Service

**File**: `frontend/src/services/effects.ts`

TypeScript API wrapper with typed interfaces:

```typescript
interface Effect {
  id: number;
  name: string;
  category: string;
  description: string;
  default_params_json: string;
}

interface FxPreset {
  id: number;
  name: string;
  description: string;
  category: string;
  effects_json: string;
  is_factory: number;
  created_at: string;
}

interface EffectChainItem {
  id: number;
  deck_id: string;
  slot: number;
  effect_id: number;
  effect_name: string;
  category: string;
  params_json: string;
  enabled: number;
  wet_dry: number;
}
```

## Usage Examples

### Apply Factory Preset to Deck A
```typescript
import { applyPresetToDeck } from '../services/effects';

// Apply "Big Room Reverb" preset (ID 3)
const chain = await applyPresetToDeck('A', 3);
console.log(`Applied ${chain.length} effects to deck A`);
```

### Add Custom Effect
```typescript
import { addEffectToDeck } from '../services/effects';

// Add distortion to deck B, slot 0
const effect = await addEffectToDeck('B', 'Distortion', 0, {
  drive: 0.7,
  tone: 0.5,
  mix: 0.5,
  type: 'warm'
}, 0.6);
```

### Update Effect Parameters
```typescript
import { updateDeckEffect } from '../services/effects';

// Increase reverb room size
await updateDeckEffect(chainId, {
  params: { room_size: 0.9, damping: 0.3, wet: 0.5 },
  wetDry: 0.7
});
```

### Create Custom Preset
```typescript
import { createFxPreset } from '../services/effects';

const preset = await createFxPreset(
  'My Reverb + Delay',
  'Spacious ambient effect',
  'Space',
  [
    {
      effect_id: 'reverb',
      params: { room_size: 0.8, damping: 0.4, wet: 0.4 },
      wet_dry: 1.0
    },
    {
      effect_id: 'delay',
      params: { time: 500, feedback: 0.3, wet: 0.3 },
      wet_dry: 0.7
    }
  ]
);
```

## Implementation Notes

### Audio Processing
The current implementation provides the **control interface** for effects. Actual DSP audio processing requires Web Audio API integration:

1. Create `AudioContext` and audio graph
2. Map effect types to Web Audio nodes (BiquadFilterNode, ConvolverNode, DelayNode, etc.)
3. Connect effect chain: source → effect1 → effect2 → ... → destination
4. Apply parameters from `effect_chains` table in real-time

### Parameter Ranges
Each effect has sensible default ranges:
- **Frequency**: 20 Hz - 20 kHz
- **Gain/dB**: -12 to +12 dB
- **Mix/Wet-Dry**: 0.0 to 1.0
- **Time**: milliseconds or synced note values
- **Resonance/Q**: 0.0 to 1.0

### BPM Sync
Delay/Echo effects support BPM synchronization:
- When `sync: true`, `note_value` determines delay time
- Calculate: `delay_ms = (60000 / bpm) * note_multiplier`
- Example: 1/4 note at 120 BPM = (60000 / 120) * 1 = 500ms

### Factory Presets
Factory presets (`is_factory = 1`) are **read-only**. Users can:
- Apply factory presets to decks
- Create custom presets based on factory ones
- Modify custom presets only

## Future Enhancements

1. **Web Audio Integration**: Connect control interface to actual DSP processing
2. **Preset Preview**: Audition presets before applying
3. **Macro Controls**: Map multiple parameters to single knob
4. **Effect Routing**: Parallel chains, send/return busses
5. **Spectrum Analyzer**: Visual feedback for EQ/filter effects
6. **MIDI Mapping**: Control parameters with external controllers
7. **Automation**: Record and playback parameter changes
8. **More Effects**: Vocoder sidechain, frequency shifter, tape saturation

## Troubleshooting

### Effects not persisting across sessions
- Check database connection in `backend/app/api/dj.py`
- Verify `initialize_effect_library()` runs on startup

### Cannot update factory preset
- Factory presets are locked (`is_factory = 1`)
- Clone preset with `/fx-presets/enhanced` POST endpoint

### Effect parameters not updating
- Ensure `params_json` is valid JSON
- Check browser console for API errors
- Verify `effect_chains.id` matches chain item

### Effect library empty
- Run `initialize_effect_library()` manually
- Check `effects` table in SQLite database
- Ensure backend started successfully

## API Error Codes

- **404**: Effect/preset/chain item not found
- **403**: Cannot modify factory preset
- **400**: Invalid JSON in request body
- **500**: Database or server error
