## Overview: IATA Segregation Requirements

Air cargo mixing is governed primarily by **IATA Table 9.3.A** (Segregation of Packages), which specifies which dangerous goods classes can't be stored together. This is part of the **IATA Dangerous Goods Regulations (DGR)**.

## Dangerous Goods Classes & Segregation

### Main Dangerous Goods Classes:

- **Class 1**: Explosives
- **Class 2**: Gases (flammable, non-flammable, toxic)
- **Class 3**: Flammable liquids
- **Class 4**: Flammable solids
- **Class 5**: Oxidizers and organic peroxides
- **Class 6**: Toxic and infectious substances
- **Class 7**: Radioactive materials
- **Class 8**: Corrosives
- **Class 9**: Miscellaneous (includes lithium batteries)

### Key Segregation Rules

**Cannot mix together in same ULD:**

- ❌ **Class 5.1 (oxidizers) + Class 3 (flammables)** - Risk of spontaneous ignition
- ❌ **Class 8 (corrosives) + Class 4 (flammable solids)** - Can react dangerously
- ❌ **Class 1 (explosives) + most other classes** - Obvious safety risk
- ❌ **Lithium batteries (Class 9) + Class 1 explosives** - Except Division 1.4S

**Exemptions (can generally mix):**

- ✅ **Classes 1.4S, 6, 7, and 9** are typically exempt from segregation
- ✅ Non-dangerous goods can mix together freely

**How to Read Table 9.3.A:**

- **"X" at intersection** = Must be segregated (cannot be in same ULD)
- **"-" (dash)** = No segregation required (can mix)

## Temperature-Controlled Cargo

**Cannot mix different temperature zones in same ULD:**

- ❌ Frozen cargo (-18°C) + Chilled cargo (2-8°C)
- ❌ Room temperature cargo + Refrigerated cargo
- ❌ Pharmaceuticals requiring -80°C + standard cold chain (2-8°C)

**Temperature ranges:**

- **Deep frozen**: <-18°C (seafood, some biologics)
- **Chilled/Refrigerated**: 2-8°C (vaccines, fresh produce, pharmaceuticals)
- **Room temperature**: 15-25°C (general cargo)

**Special equipment:** Temperature-Controlled Containers (TCCs) like RKN (LD3) and RAP (LD9) are needed - these are separate ULD types.

## Live Animals

**Critical restrictions:**

- ❌ **Live animals CANNOT be loaded into ULDs at all** - they go directly into approved aircraft compartments
- ❌ Cannot mix with dangerous goods
- ❌ Cannot mix with food items (unless hermetically sealed)
- ❌ Must be on separate Air Waybill from other cargo

**Implementation note:** If your system handles live animals, they should be excluded from ULD optimization entirely.

## Food & Contamination Rules

**Critical separation (49 CFR 175.630):**

- ❌ **Division 6.1 (toxic/poisonous) + foodstuffs** - Must be in separate ULDs
- ❌ **Division 6.2 (infectious substances) + foodstuffs** - Must be in separate ULDs
- ❌ **Division 2.3 (poisonous gases) + foodstuffs** - Must be in separate ULDs

**Definition of foodstuffs:** Any material marked as or known to be food, feed, or edible material for human or animal consumption.

**Decontamination requirement:** If leakage occurs, the entire compartment must be inspected and decontaminated.

## Practical Implementation for Your Algorithm

Here's how to structure compatibility rules in code:

```python
# Simplified cargo compatibility matrix
INCOMPATIBLE_PAIRS = [
    # Dangerous goods combinations
    ("DG_CLASS_1", "DG_CLASS_3"),  # Explosives + Flammables
    ("DG_CLASS_5.1", "DG_CLASS_3"), # Oxidizers + Flammables
    ("DG_CLASS_8", "DG_CLASS_4"),   # Corrosives + Flammable solids

    # Food contamination rules
    ("DG_CLASS_6.1", "FOODSTUFF"),  # Toxic + Food
    ("DG_CLASS_6.2", "FOODSTUFF"),  # Infectious + Food
    ("DG_CLASS_2.3", "FOODSTUFF"),  # Poison gas + Food

    # Temperature incompatibilities
    ("TEMP_FROZEN", "TEMP_CHILLED"),
    ("TEMP_FROZEN", "TEMP_AMBIENT"),
    ("TEMP_CHILLED", "TEMP_AMBIENT"),

    # Live animals (don't use ULDs at all)
    ("LIVE_ANIMAL", "*"),  # Animals incompatible with everything
]

def can_mix_in_same_uld(item1, item2):
    """Check if two cargo items can be in the same ULD"""
    # Check incompatible pairs
    for incompatible in INCOMPATIBLE_PAIRS:
        class_a, class_b = incompatible
        if (item1.classification == class_a and item2.classification == class_b) or \
           (item1.classification == class_b and item2.classification == class_a):
            return False

    # Check temperature requirements
    if item1.temp_range != item2.temp_range:
        return False

    # Check if requires special ULD type
    if item1.requires_temp_control or item2.requires_temp_control:
        if item1.required_uld_type != item2.required_uld_type:
            return False

    return True

# Usage in your optimizer
def assign_cargo_to_ulds(cargo_items):
    ulds = []

    for item in cargo_items:
        placed = False

        # Try existing ULDs
        for uld in ulds:
            # Check compatibility with all items already in ULD
            if all(can_mix_in_same_uld(item, existing) for existing in uld.items):
                if can_fit(item, uld):  # Also check physical space
                    uld.add(item)
                    placed = True
                    break

        # Create new ULD if needed
        if not placed:
            new_uld = create_appropriate_uld(item)  # May be TCC for temp-controlled
            new_uld.add(item)
            ulds.append(new_uld)

    return ulds
```

## Simplified Rule Set for Hackathon

For a MVP, you could implement these essential rules:

1. ✅ **General cargo** can mix freely
2. ❌ **Dangerous goods** need segregation (implement simplified matrix)
3. ❌ **Different temperature ranges** cannot mix
4. ❌ **Food + toxic/infectious** substances must be separate
5. ❌ **Live animals** excluded from ULD system

## Data Structure for Cargo Items

```python
class CargoItem:
    def __init__(self):
        self.id = ""
        self.weight = 0  # kg
        self.dimensions = (0, 0, 0)  # L x W x H in cm
        self.volume = 0  # cubic meters

        # Compatibility attributes
        self.is_dangerous_goods = False
        self.dg_class = None  # "CLASS_3", "CLASS_6.1", etc.
        self.is_foodstuff = False
        self.temp_requirement = "AMBIENT"  # FROZEN, CHILLED, AMBIENT
        self.is_live_animal = False

        # Priority
        self.priority = "STANDARD"  # EXPRESS, STANDARD
```

## Key Takeaways for Your Optimizer

1. **Compatibility checking is O(n)** per placement attempt (must check against all items in ULD)
2. **Temperature control cargo** needs special ULD types (TCCs) - separate optimization
3. **Live animals** should be filtered out entirely from ULD optimization
4. **Most cargo is general cargo** - dangerous goods are minority (~5-10% of shipments)
5. For hackathon, you can **simplify** by focusing on 3-4 key incompatibility rules

This will make your optimizer much more realistic and impressive to judges - showing you understand real operational constraints!
