# PokeSense UI Wireframes

## Main Application Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ PokeSense - Pokemon Collection Management                     ▢ □ X │
├───────────────┬─────────────────────────────────────────────────┤
│               │                                                 │
│  SEARCH       │                                                 │
│  ┌──────────┐ │  [Search Results] [Collection] [Analysis]       │
│  │ Pokemon  │ │  ┌─────────┬─────────┬─────────┐               │
│  └──────────┘ │  │         │         │         │               │
│  [Search]     │  │ Pokemon │ Pokemon │ Pokemon │               │
│               │  │ Card    │ Card    │ Card    │               │
│  COLLECTION   │  │         │         │         │               │
│  Total: 42    │  └─────────┴─────────┴─────────┘               │
│  Favorites: 7 │  ┌─────────┬─────────┬─────────┐               │
│               │  │         │         │         │               │
│  TYPES:       │  │ Pokemon │ Pokemon │ Pokemon │               │
│  Fire: 8      │  │ Card    │ Card    │ Card    │               │
│  Water: 10    │  │         │         │         │               │
│  Electric: 5  │  └─────────┴─────────┴─────────┘               │
│  Grass: 7     │                                                 │
│  Other: 12    │                                                 │
│               │                                                 │
├───────────────┴─────────────────────────────────────────────────┤
│ Developed by Team PokeSense                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Pokemon Card Component

```
┌───────────────────────────┐
│ #025 Pikachu              │
│ ┌─────────┐ ┌───────────┐ │
│ │         │ │ ELECTRIC  │ │
│ │  [IMG]  │ └───────────┘ │
│ │         │ Height: 0.4m  │
│ └─────────┘ Weight: 6.0kg │
│                           │
│ [Add to Collection] [Info]│
└───────────────────────────┘
```

## Pokemon Detail View

```
┌─────────────────────────────────────────────────────┐
│ #025 Pikachu                                        │
├───────────┬─────────────────────────────────────────┤
│           │ ┌───────────┐                           │
│           │ │ ELECTRIC  │                           │
│  [IMG]    │ └───────────┘                           │
│           │                                         │
│ [Sprites] │ Height: 0.4m                            │
│           │ Weight: 6.0kg                           │
│           │                                         │
│           │ ✓ Favorite                              │
│           │                                         │
│           │ Notes: ________________________          │
│           │       ________________________          │
│           │                                         │
├───────────┴─────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ STATS                                           │ │
│ │ HP:      35 ████░░░░░░░░░░░░░░░░                │ │
│ │ Attack:  55 ███████░░░░░░░░░░░                  │ │
│ │ Defense: 40 █████░░░░░░░░░░░░░                  │ │
│ │ Speed:   90 ████████████░░░░░░                  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ABILITIES                                       │ │
│ │ • Static                                        │ │
│ │ • Lightning Rod (Hidden)                        │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ MOVES                                           │ │
│ │ Thunder Shock, Tail Whip, Growl, Play Nice,     │ │
│ │ Quick Attack, Thunder Wave, Electro Ball...     │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Update] [Remove from Collection]                   │
└─────────────────────────────────────────────────────┘
```

## Collection View

```
┌─────────────────────────────────────────────────────────────────┐
│ My Pokemon Collection                                           │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌──────────────────────────────────────────┐│
│ │ Filter by:      │ │ Sort by: [Name ▼] [ID] [Type] [Favorite] ││
│ │ □ All           │ └──────────────────────────────────────────┘│
│ │ □ Favorites     │  ┌─────────┬─────────┬─────────┬─────────┐  │
│ │ Type:           │  │         │         │         │         │  │
│ │ □ Electric      │  │ Pokemon │ Pokemon │ Pokemon │ Pokemon │  │
│ │ □ Fire          │  │ Card    │ Card    │ Card    │ Card    │  │
│ │ □ Water         │  │         │         │         │         │  │
│ │ □ Grass         │  └─────────┴─────────┴─────────┴─────────┘  │
│ │ □ ...           │  ┌─────────┬─────────┬─────────┬─────────┐  │
│ │                 │  │         │         │         │         │  │
│ │ ┌─────────────┐ │  │ Pokemon │ Pokemon │ Pokemon │ Pokemon │  │
│ │ │    Apply    │ │  │ Card    │ Card    │ Card    │ Card    │  │
│ │ └─────────────┘ │  │         │         │         │         │  │
│ └─────────────────┘  └─────────┴─────────┴─────────┴─────────┘  │
│                                                                 │
│ Pokemon Selected: Pikachu                                       │
│ [View Details] [Remove from Collection]                         │
└─────────────────────────────────────────────────────────────────┘
```

## Type Analysis View

```
┌─────────────────────────────────────────────────────────────────┐
│ Pokemon Type Analysis                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────┐ ┌─────────────────────────────┐ │
│ │ Type Distribution           │ │ Primary Types               │ │
│ │                             │ │                             │ │
│ │ [Pie Chart of Pokemon       │ │ [Bar Chart showing count    │ │
│ │  types in collection]       │ │  of each primary type]      │ │
│ │                             │ │                             │ │
│ └─────────────────────────────┘ └─────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Type Strength/Weakness Analysis                             │ │
│ │                                                             │ │
│ │ [Heatmap showing effective coverage against all types]      │ │
│ │                                                             │ │
│ │ Strong against: Ghost, Psychic                              │ │
│ │ Weak against: Ground, Rock                                  │ │
│ │                                                             │ │
│ │ Recommendation: Add a Water or Grass type to your collection│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Responsive Mobile View

```
┌───────────────────┐
│ PokeSense     ☰   │
├───────────────────┤
│ ┌─────────────┐   │
│ │ Search      │ 🔍 │
│ └─────────────┘   │
│                   │
│ [Search Results]  │
│ [Collection]      │
│ [Analysis]        │
│                   │
│ ┌───────────────┐ │
│ │ #025 Pikachu  │ │
│ │ ┌─────┐ ELEC  │ │
│ │ │ IMG │ 0.4m  │ │
│ │ └─────┘ 6.0kg │ │
│ │ [Details]     │ │
│ └───────────────┘ │
│                   │
│ ┌───────────────┐ │
│ │ #007 Squirtle │ │
│ │ ┌─────┐ WATER │ │
│ │ │ IMG │ 0.5m  │ │
│ │ └─────┘ 9.0kg │ │
│ │ [Details]     │ │
│ └───────────────┘ │
│                   │
└───────────────────┘
```