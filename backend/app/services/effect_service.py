"""
Effect Library Service
Manages effect definitions, presets, and chains for DJ mixing.
"""

import json
import sqlite3
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime

# Effect library with default parameters
EFFECT_LIBRARY = {
    "eq_three_band": {
        "name": "3-Band EQ",
        "category": "EQ",
        "description": "Three-band equalizer with low, mid, and high frequency control",
        "default_params": {
            "low": 0.0,      # -12 to +12 dB
            "mid": 0.0,
            "high": 0.0,
            "low_freq": 250,   # Hz
            "mid_freq": 1000,
            "high_freq": 4000
        }
    },
    "filter_highpass": {
        "name": "High Pass Filter",
        "category": "Filter",
        "description": "Removes low frequencies below cutoff",
        "default_params": {
            "cutoff": 20,      # 20 Hz to 20 kHz
            "resonance": 0.5,  # 0 to 1
            "slope": 12        # dB/octave (12, 24, 48)
        }
    },
    "filter_lowpass": {
        "name": "Low Pass Filter",
        "category": "Filter",
        "description": "Removes high frequencies above cutoff",
        "default_params": {
            "cutoff": 20000,
            "resonance": 0.5,
            "slope": 12
        }
    },
    "filter_bandpass": {
        "name": "Band Pass Filter",
        "category": "Filter",
        "description": "Allows frequencies in a specific band to pass",
        "default_params": {
            "center_freq": 1000,
            "bandwidth": 1.0,   # octaves
            "resonance": 0.5
        }
    },
    "reverb": {
        "name": "Reverb",
        "category": "Space",
        "description": "Adds spatial depth and ambience",
        "default_params": {
            "room_size": 0.5,  # 0 to 1
            "damping": 0.5,
            "wet": 0.3,
            "dry": 0.7,
            "width": 1.0,
            "pre_delay": 0     # milliseconds
        }
    },
    "delay": {
        "name": "Delay",
        "category": "Time",
        "description": "Time-based echo effect",
        "default_params": {
            "time": 500,       # milliseconds
            "feedback": 0.3,   # 0 to 1
            "wet": 0.3,
            "dry": 0.7,
            "sync": True,      # sync to BPM
            "note_value": "1/4"  # when synced: 1/4, 1/8, 1/16, etc.
        }
    },
    "echo": {
        "name": "Echo",
        "category": "Time",
        "description": "Multi-tap delay with modulation",
        "default_params": {
            "time": 375,
            "feedback": 0.5,
            "taps": 3,
            "modulation": 0.2,
            "ping_pong": False
        }
    },
    "distortion": {
        "name": "Distortion",
        "category": "Drive",
        "description": "Adds harmonic saturation and grit",
        "default_params": {
            "drive": 0.5,      # 0 to 1
            "tone": 0.5,
            "mix": 0.3,
            "type": "warm"     # warm, hard, fuzzy, tube
        }
    },
    "bitcrusher": {
        "name": "Bitcrusher",
        "category": "Drive",
        "description": "Digital distortion via bit depth and sample rate reduction",
        "default_params": {
            "bit_depth": 16,   # 1 to 16 bits
            "sample_rate": 44100,  # Hz
            "mix": 0.5
        }
    },
    "phaser": {
        "name": "Phaser",
        "category": "Modulation",
        "description": "Phase shifting modulation effect",
        "default_params": {
            "rate": 0.5,       # Hz
            "depth": 0.5,      # 0 to 1
            "feedback": 0.3,
            "stages": 4,       # 2, 4, 6, 8
            "mix": 0.5
        }
    },
    "flanger": {
        "name": "Flanger",
        "category": "Modulation",
        "description": "Sweeping comb filter effect",
        "default_params": {
            "rate": 0.2,
            "depth": 0.5,
            "feedback": 0.5,
            "delay": 5,        # milliseconds
            "mix": 0.5
        }
    },
    "chorus": {
        "name": "Chorus",
        "category": "Modulation",
        "description": "Thickens sound with detuned copies",
        "default_params": {
            "rate": 1.5,
            "depth": 0.3,
            "voices": 3,
            "mix": 0.4
        }
    },
    "compressor": {
        "name": "Compressor",
        "category": "Dynamics",
        "description": "Reduces dynamic range for consistent levels",
        "default_params": {
            "threshold": -20,  # dB
            "ratio": 4.0,      # 1:1 to 20:1
            "attack": 5,       # milliseconds
            "release": 50,
            "makeup": 0        # dB
        }
    },
    "limiter": {
        "name": "Limiter",
        "category": "Dynamics",
        "description": "Prevents signal from exceeding threshold",
        "default_params": {
            "threshold": -0.1,
            "release": 10
        }
    },
    "gate": {
        "name": "Gate",
        "category": "Dynamics",
        "description": "Silences signal below threshold",
        "default_params": {
            "threshold": -40,
            "attack": 1,
            "hold": 10,
            "release": 50
        }
    },
    "autopan": {
        "name": "Auto Pan",
        "category": "Modulation",
        "description": "Automatic stereo panning",
        "default_params": {
            "rate": 0.5,
            "depth": 0.5,
            "shape": "sine"    # sine, triangle, square
        }
    },
    "tremolo": {
        "name": "Tremolo",
        "category": "Modulation",
        "description": "Amplitude modulation",
        "default_params": {
            "rate": 4.0,
            "depth": 0.5,
            "shape": "sine"
        }
    },
    "vocoder": {
        "name": "Vocoder",
        "category": "Special",
        "description": "Robot voice effect",
        "default_params": {
            "bands": 16,
            "carrier_freq": 440,
            "mix": 0.5
        }
    },
    "ringmod": {
        "name": "Ring Modulator",
        "category": "Special",
        "description": "Metallic, bell-like tones",
        "default_params": {
            "frequency": 100,
            "mix": 0.5
        }
    }
}

# Factory presets
FACTORY_PRESETS = [
    {
        "name": "Club EQ Boost",
        "description": "Enhances bass and treble for club sound",
        "category": "EQ",
        "effects": [
            {"effect_id": "eq_three_band", "params": {"low": 3, "mid": 0, "high": 2}, "wet_dry": 1.0}
        ]
    },
    {
        "name": "Radio Filter",
        "description": "Vintage radio sound",
        "category": "Filter",
        "effects": [
            {"effect_id": "filter_bandpass", "params": {"center_freq": 1500, "bandwidth": 0.5}, "wet_dry": 0.8}
        ]
    },
    {
        "name": "Big Room Reverb",
        "description": "Large hall reverb",
        "category": "Space",
        "effects": [
            {"effect_id": "reverb", "params": {"room_size": 0.9, "damping": 0.3, "wet": 0.4}, "wet_dry": 1.0}
        ]
    },
    {
        "name": "1/4 Note Delay",
        "description": "Quarter note synced delay",
        "category": "Time",
        "effects": [
            {"effect_id": "delay", "params": {"sync": True, "note_value": "1/4", "feedback": 0.4}, "wet_dry": 0.5}
        ]
    },
    {
        "name": "Dirty Drop",
        "description": "Heavy distortion for drops",
        "category": "Drive",
        "effects": [
            {"effect_id": "distortion", "params": {"drive": 0.8, "type": "hard", "mix": 0.7}, "wet_dry": 1.0}
        ]
    },
    {
        "name": "Lo-Fi Crush",
        "description": "8-bit video game sound",
        "category": "Drive",
        "effects": [
            {"effect_id": "bitcrusher", "params": {"bit_depth": 8, "sample_rate": 8000, "mix": 0.8}, "wet_dry": 1.0}
        ]
    },
    {
        "name": "Psychedelic Phase",
        "description": "Deep phasing sweep",
        "category": "Modulation",
        "effects": [
            {"effect_id": "phaser", "params": {"rate": 0.3, "depth": 0.8, "feedback": 0.6, "stages": 8}, "wet_dry": 0.7}
        ]
    },
    {
        "name": "Flanged Out",
        "description": "Intense flanging",
        "category": "Modulation",
        "effects": [
            {"effect_id": "flanger", "params": {"rate": 0.4, "depth": 0.8, "feedback": 0.7}, "wet_dry": 0.6}
        ]
    },
    {
        "name": "Pump & Drive",
        "description": "Compression + distortion combo",
        "category": "Dynamics",
        "effects": [
            {"effect_id": "compressor", "params": {"threshold": -15, "ratio": 6.0, "attack": 2}, "wet_dry": 1.0},
            {"effect_id": "distortion", "params": {"drive": 0.4, "type": "warm", "mix": 0.3}, "wet_dry": 1.0}
        ]
    }
]


def initialize_effect_library(db_path: Path):
    """Populate effect library with built-in effects"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    try:
        for effect_id, effect_data in EFFECT_LIBRARY.items():
            conn.execute(
                """
                INSERT OR IGNORE INTO effects (name, category, description, default_params_json, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
                """,
                (
                    effect_data["name"],
                    effect_data["category"],
                    effect_data["description"],
                    json.dumps(effect_data["default_params"])
                )
            )
        
        # Add factory presets
        for preset in FACTORY_PRESETS:
            conn.execute(
                """
                INSERT OR IGNORE INTO fx_presets (name, description, category, effects_json, is_factory, created_at)
                VALUES (?, ?, ?, ?, 1, datetime('now'))
                """,
                (
                    preset["name"],
                    preset["description"],
                    preset["category"],
                    json.dumps(preset["effects"])
                )
            )
        
        conn.commit()
    finally:
        conn.close()


def list_effects(db_path: Path, category: Optional[str] = None) -> List[Dict[str, Any]]:
    """List all available effects, optionally filtered by category"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    if category:
        rows = conn.execute(
            "SELECT id, name, category, description, default_params_json FROM effects WHERE category=? ORDER BY name",
            (category,)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT id, name, category, description, default_params_json FROM effects ORDER BY category, name"
        ).fetchall()
    
    conn.close()
    return [dict(r) for r in rows]


def get_effect_categories(db_path: Path) -> List[str]:
    """Get list of effect categories"""
    conn = sqlite3.connect(db_path)
    rows = conn.execute("SELECT DISTINCT category FROM effects ORDER BY category").fetchall()
    conn.close()
    return [r[0] for r in rows]


def list_fx_presets_enhanced(db_path: Path, category: Optional[str] = None) -> List[Dict[str, Any]]:
    """List all FX presets with full details"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    if category:
        rows = conn.execute(
            "SELECT id, name, description, category, effects_json, is_factory, created_at FROM fx_presets WHERE category=? ORDER BY is_factory DESC, created_at DESC",
            (category,)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT id, name, description, category, effects_json, is_factory, created_at FROM fx_presets ORDER BY is_factory DESC, created_at DESC"
        ).fetchall()
    
    conn.close()
    return [dict(r) for r in rows]


def add_fx_preset_enhanced(
    db_path: Path,
    name: str,
    description: str,
    category: str,
    effects_json: str
) -> Dict[str, Any]:
    """Create a new custom FX preset"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    cursor = conn.execute(
        """
        INSERT INTO fx_presets (name, description, category, effects_json, is_factory, created_at)
        VALUES (?, ?, ?, ?, 0, datetime('now'))
        """,
        (name, description, category, effects_json)
    )
    preset_id = cursor.lastrowid
    conn.commit()
    
    row = conn.execute(
        "SELECT id, name, description, category, effects_json, is_factory, created_at FROM fx_presets WHERE id=?",
        (preset_id,)
    ).fetchone()
    conn.close()
    
    return dict(row)


def update_fx_preset(
    db_path: Path,
    preset_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    category: Optional[str] = None,
    effects_json: Optional[str] = None
) -> bool:
    """Update an existing preset"""
    conn = sqlite3.connect(db_path)
    
    # Don't allow updating factory presets
    row = conn.execute("SELECT is_factory FROM fx_presets WHERE id=?", (preset_id,)).fetchone()
    if not row or row[0] == 1:
        conn.close()
        return False
    
    updates = []
    params = []
    
    if name is not None:
        updates.append("name=?")
        params.append(name)
    if description is not None:
        updates.append("description=?")
        params.append(description)
    if category is not None:
        updates.append("category=?")
        params.append(category)
    if effects_json is not None:
        updates.append("effects_json=?")
        params.append(effects_json)
    
    if not updates:
        conn.close()
        return True
    
    params.append(preset_id)
    conn.execute(f"UPDATE fx_presets SET {', '.join(updates)} WHERE id=?", params)
    conn.commit()
    conn.close()
    
    return True


def get_deck_effect_chain(db_path: Path, deck_id: str) -> List[Dict[str, Any]]:
    """Get active effect chain for a deck"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    rows = conn.execute(
        """
        SELECT ec.id, ec.deck_id, ec.slot, ec.effect_id, ec.params_json, ec.enabled, ec.wet_dry,
               e.name as effect_name, e.category, e.default_params_json
        FROM effect_chains ec
        JOIN effects e ON ec.effect_id = e.id
        WHERE ec.deck_id = ?
        ORDER BY ec.slot
        """,
        (deck_id,)
    ).fetchall()
    
    conn.close()
    return [dict(r) for r in rows]


def add_effect_to_chain(
    db_path: Path,
    deck_id: str,
    effect_name: str,
    slot: int,
    params_json: Optional[str] = None,
    wet_dry: float = 0.5
) -> Dict[str, Any]:
    """Add an effect to a deck's chain at specified slot"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    # Get effect ID by name
    effect_row = conn.execute("SELECT id, default_params_json FROM effects WHERE name=?", (effect_name,)).fetchone()
    if not effect_row:
        conn.close()
        raise ValueError(f"Effect '{effect_name}' not found")
    
    effect_id = effect_row[0]
    default_params = effect_row[1]
    
    # Use provided params or defaults
    if params_json is None:
        params_json = default_params
    
    # Remove existing effect at this slot
    conn.execute("DELETE FROM effect_chains WHERE deck_id=? AND slot=?", (deck_id, slot))
    
    cursor = conn.execute(
        """
        INSERT INTO effect_chains (deck_id, slot, effect_id, params_json, enabled, wet_dry, created_at)
        VALUES (?, ?, ?, ?, 1, ?, datetime('now'))
        """,
        (deck_id, slot, effect_id, params_json, wet_dry)
    )
    chain_id = cursor.lastrowid
    conn.commit()
    
    row = conn.execute(
        """
        SELECT ec.id, ec.deck_id, ec.slot, ec.effect_id, ec.params_json, ec.enabled, ec.wet_dry,
               e.name as effect_name, e.category
        FROM effect_chains ec
        JOIN effects e ON ec.effect_id = e.id
        WHERE ec.id=?
        """,
        (chain_id,)
    ).fetchone()
    conn.close()
    
    return dict(row)


def update_effect_params(
    db_path: Path,
    chain_id: int,
    params_json: Optional[str] = None,
    wet_dry: Optional[float] = None,
    enabled: Optional[bool] = None
) -> bool:
    """Update parameters of an effect in a chain"""
    conn = sqlite3.connect(db_path)
    
    updates = []
    params = []
    
    if params_json is not None:
        updates.append("params_json=?")
        params.append(params_json)
    if wet_dry is not None:
        updates.append("wet_dry=?")
        params.append(wet_dry)
    if enabled is not None:
        updates.append("enabled=?")
        params.append(1 if enabled else 0)
    
    if not updates:
        conn.close()
        return True
    
    params.append(chain_id)
    conn.execute(f"UPDATE effect_chains SET {', '.join(updates)} WHERE id=?", params)
    conn.commit()
    conn.close()
    
    return True


def remove_effect_from_chain(db_path: Path, chain_id: int) -> bool:
    """Remove an effect from a deck's chain"""
    conn = sqlite3.connect(db_path)
    cursor = conn.execute("DELETE FROM effect_chains WHERE id=?", (chain_id,))
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success


def clear_deck_effects(db_path: Path, deck_id: str) -> bool:
    """Clear all effects from a deck"""
    conn = sqlite3.connect(db_path)
    conn.execute("DELETE FROM effect_chains WHERE deck_id=?", (deck_id,))
    conn.commit()
    conn.close()
    return True


def apply_preset_to_deck(db_path: Path, deck_id: str, preset_id: int) -> List[Dict[str, Any]]:
    """Apply a preset's effect chain to a deck"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    # Get preset
    preset_row = conn.execute(
        "SELECT effects_json FROM fx_presets WHERE id=?",
        (preset_id,)
    ).fetchone()
    
    if not preset_row:
        conn.close()
        raise ValueError(f"Preset {preset_id} not found")
    
    effects = json.loads(preset_row[0])
    
    # Clear existing chain
    conn.execute("DELETE FROM effect_chains WHERE deck_id=?", (deck_id,))
    
    # Add each effect
    chain = []
    for idx, effect_data in enumerate(effects):
        effect_id_or_name = effect_data["effect_id"]
        
        # Get effect ID (might be name or ID)
        if isinstance(effect_id_or_name, str):
            effect_row = conn.execute("SELECT id FROM effects WHERE name=?", (effect_id_or_name,)).fetchone()
            if not effect_row:
                continue
            effect_id = effect_row[0]
        else:
            effect_id = effect_id_or_name
        
        params_json = json.dumps(effect_data.get("params", {}))
        wet_dry = effect_data.get("wet_dry", 0.5)
        
        cursor = conn.execute(
            """
            INSERT INTO effect_chains (deck_id, slot, effect_id, params_json, enabled, wet_dry, created_at)
            VALUES (?, ?, ?, ?, 1, ?, datetime('now'))
            """,
            (deck_id, idx, effect_id, params_json, wet_dry)
        )
        
        chain.append({
            "id": cursor.lastrowid,
            "deck_id": deck_id,
            "slot": idx,
            "effect_id": effect_id,
            "params_json": params_json,
            "wet_dry": wet_dry,
            "enabled": True
        })
    
    conn.commit()
    conn.close()
    
    return chain
