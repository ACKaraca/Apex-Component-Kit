# ACK Framework - Sequence & Flow Diagrams

**Türkçe**: ACK Framework'ün tüm bileşenleri arasında veri ve olay akışını gösteren detaylı diagramlar.

---

## 📐 1. Project Creation Flow (Başlangıç - Proje Oluşturma)

```
CLI User                 @ack/cli              File System         @ack/kit
   |                         |                      |                 |
   |-- create my-app -------->|                      |                 |
   |                         |-- validate name --    |                 |
   |                         |-- select template ----->|                |
   |                         |-- scaffold dirs ------>|                |
   |                         |-- copy files --------->|                |
   |                         |-- create package.json ->|               |
   |                         |-- vite.config.ts ----->|               |
   |                         |-- install deps ------>|                |
   |                         |                      |-- initialize kit->|
   |                         |                      |                 |
   |<-- Project Created ------| <-- Success ---------|<-- Ready -------|
   |                         |                      |                 |
```

---

## 📐 2. Build Time - Compilation Flow (Derleme)

```
User (.ack file)         @ack/vite-plugin      @ack/compiler         AST           Output
        |                      |                      |               |              |
        |-- Component.ack ----->|                      |               |              |
        |                      |-- read file -------->|               |              |
        |                      |                      |-- tokenize ---|              |
        |                      |                      |-- parse -------|-- AST ----->|
        |                      |                      |-- analyze ----|   (nodes)   |
        |                      |                      |-- dependency graph          |
        |                      |                      |-- codegen -------->|        |
        |                      |                      |                   |-- JS Code
        |                      |<-- compiled code -----| <-- ESM/CJS ------| <--|
        |                      |-- cache result ------|                   |
        |<-- transformed JS ----| <-- cached ---------|                   |
        |                      |                      |                   |
```

---

## 📐 3. Dev Server Flow (Geliştirme Sunucusu)

```
Browser                  Vite Dev Server         @ack/vite-plugin      Hot Reload
   |                          |                         |                  |
   |-- http://localhost:5173 ->|                         |                  |
   |                          |-- serve index.html ----->|                  |
   |<-- initial HTML ----------|                         |                  |
   |                          |                         |                  |
   |-- request Component.ack ->|-- check cache -------->|                  |
   |                          |-- file changed? ------>|-- recompile      |
   |                          |<-- JS bundle -----------|                  |
   |<-- compiled JS -----------|                         |                  |
   |                          |                         |                  |
   |-- User edits file ------->|                         |                  |
   |  (Component.ack)         |-- file watcher -------->|-- detect change  |
   |                          |<-- recompile -----------|                  |
   |<-- HMR update ------------|-- send via WebSocket ---|                  |
   |-- Apply changes -------->|                         |<-- reload module -|
   |-- Preserve state ------->|                         |                  |
   |-- Render ----------------->|                         |<-- Done --------|
```

---

## 📐 4. Runtime - Component Initialization (Çalışma Zamanı - Başlangıç)

```
Compiled JS              @ack/runtime            Reactivity            DOM
    |                        |                      |                   |
    |-- import Component --->|                      |                   |
    |-- props =-{count: 0}->|                       |                   |
    |-- mount(el) --------->|                       |                   |
    |                       |-- createReactive --->|                   |
    |                       |<-- proxy object ------|                   |
    |                       |-- create watchers --->|                   |
    |                       |-- createEffect ------>|                   |
    |                       |                      |-- setup tracking  |
    |                       |-- render ---------->|                   |
    |                       |-- generate vNodes -->|                   |
    |                       |-- DOM mount ----------|-- appendChild --->|
    |                       |-- event handlers ---->|-- addEventListener|
    |<-- Component Ready ----|                     |                   |
    |                       |                      |                   |
```

---

## 📐 5. Runtime - User Interaction Flow (Çalışma Zamanı - Kullanıcı Etkileşimi)

```
User (Click)            DOM                @ack/runtime          Reactivity        Effects
    |                    |                      |                   |                 |
    |-- @click button -->|-- click event ----->|                   |                 |
    |                    |                      |-- handler ------->|                 |
    |                    |                      |                   |-- count++ ----->|
    |                    |                      |                   |                 |
    |                    |                      |<-- setter ---------|                 |
    |                    |                      |                   |                 |
    |                    |                      |-- notify watchers-->|-- trigger ---->|
    |                    |                      |                   |                 |
    |                    |                      |<-- computed recompute| get new value
    |                    |                      |                   |                 |
    |                    |                      |-- createEffect --->|-- recompute
    |                    |                      |<-- cleanup --------|                 |
    |                    |                      |                   |                 |
    |                    |                      |-- DOM update ----->|-- render ------>|
    |                    |<-- update vNodes ---|                   |                 |
    |                    |-- innerHTML/props -->|                   |                 |
    |<-- UI Updated --------|<-- render complete -|                   |                 |
    |                    |                      |                   |                 |
```

---

## 📐 6. File-based Routing Flow (Dosya-Tabanlı Yönlendirme)

```
User Navigate           @ack/kit Router        File Discovery      Component          DOM
    |                        |                    |                  |                 |
    |-- /user/:id --------->|                    |                  |                 |
    |                       |-- parse route ---->|                  |                 |
    |                       |-- match pattern --->| user/[id].ack    |                 |
    |                       |<-- found ----------|                  |                 |
    |                       |-- load component -->|-- import ------->|                 |
    |                       |<-- JS module ------| <-- export -------|                 |
    |                       |-- pass params ----->|                  |                 |
    |                       |-- mount component ->|-- initialize ---->|                 |
    |                       |-- inject params --->|<-- ready --------|                 |
    |                       |-- render --------->|                   |-- vNodes ------>|
    |                       |<-- layout ---------|                   |<-- render -----| 
    |<-- Page loaded --------|                    |                   |<-- display ----|
    |                       |                    |                   |                 |
```

---

## 📐 7. State Management Flow (Durum Yönetimi)

```
Component Script         Reactive Proxy         Watcher              Template        DOM
    |                        |                    |                    |              |
    |-- let count = 0 ----->|                    |                    |              |
    |                       |-- createReactive -->|                    |              |
    |<-- proxy -----------|<-- handler ---------|                    |              |
    |                       |                    |                    |              |
    |-- watch(count) ------->|-- register ------->|                    |              |
    |                       |                    |-- callback setup   |              |
    |<-- unwatch ---------|                    |                    |              |
    |                       |                    |                    |              |
    |-- count++ (in handler) ->|-- set trap ----->|                    |              |
    |                       |                    |-- call watchers -->|              |
    |                       |                    |<-- update ---------|-- rerender -->|
    |                       |                    |                    |<-- patch ----|
    |                       |                    |                    |<-- display   |
```

---

## 📐 8. Dependency Graph & Optimization Flow (Bağımlılık Grafiği)

```
Script Block             Analyzer              DependencyGraph       CodeGen         Output
    |                        |                    |                    |               |
    |-- let a = 1 --------->|                    |                    |               |
    |-- let b = a * 2 ----->|-- analyze -------->|                    |               |
    |-- let c = b + a ----->|                    |-- build graph ----->|               |
    |                       |                    |-- detect cycles --->|               |
    |                       |                    |<-- safe -----------|               |
    |                       |-- topological sort ->|-- order vars ----->|               |
    |                       |<-- sorted list ------|<-- [a,b,c] -------|               |
    |                       |-- reactivity info -->|                    |-- mark ------>|
    |                       |<-- template refs ----|                    |-- track ------|
    |                       |                    |<-- optimization--->|               |
    |                       |                    |                    |<-- generate -->|
    |<-- analysis done ------|                    |                    |<-- JS code ----|
```

---

## 📐 9. Full Request-Response Cycle (Tam Döngü)

```
Browser                  Vite                   Compiler             Runtime         DOM
   |                      |                      |                    |              |
   |-- GET / ------------>|                      |                    |              |
   |<-- index.html --------|                     |                    |              |
   |                      |                      |                    |              |
   |-- script src=main.js ->|                    |                    |              |
   |                      |-- transpile -------->|                    |              |
   |<-- JS bundle ---------|<-- compiled --------|                    |              |
   |-- execute JS -------->|                    |                    |              |
   |                      |                      |-- initialize ----->|              |
   |                      |                      |                    |-- mount ------>|
   |                      |                      |                    |<-- render ----|
   |-- DOMContentLoaded -->|                    |                    |              |
   |                      |                    |<-- app ready -------|              |
   |<-- Page Ready --------|                    |                    |<-- display   |
```

---

## 📐 10. Error Handling & Recovery Flow (Hata Yönetimi)

```
User Action             Component              Compiler             Dev Server      Browser
    |                      |                      |                    |              |
    |-- edit file -------->|                      |                    |              |
    |                      |-- save --------->| syntax error ------->| show overlay -->|
    |                      |<-- error message -|                      |<-- display ----|
    |                      |                  |                      |              |
    |                      |                  |-- watch for fix ----->|              |
    |                      |                  |                      |              |
    |-- fix error -------->|                      |                    |              |
    |                      |-- recompile ------->| success ----------->|              |
    |                      |<-- valid ------------|                    |              |
    |                      |                  |-- HMR update ------->|              |
    |                      |                  |                      |-- reload mod ->|
    |                      |                  |<-- recovery ---------|              |
    |<-- App Works --------|                  |                      |<-- working ---|
    |                      |                  |                      |              |
```

---

## 📐 11. Build & Deploy Flow (Yapı & Dağıtım)

```
Developer               @ack/kit               Builder              Bundler          Dist
    |                      |                    |                    |               |
    |-- pnpm build -------->|                   |                    |               |
    |                      |-- analyze --------->|                   |               |
    |                      |                    |-- compile all ----->|               |
    |                      |<-- ASTs ----------| <-- transpile ------|               |
    |                      |-- code split ----->|                    |-- chunks ----->|
    |                      |                    |-- minify ----------->|-- min files ->|
    |                      |-- optimize ------->|-- gzip ----------->|               |
    |                      |                    |-- source maps ----->|               |
    |                      |<-- stats ----------|<-- metrics ---------|               |
    |                      |-- write dist ----->|                    |<-- save ------>|
    |<-- Build Complete ----|                   |                    |<-- ready ------|
    |                      |                    |                    |               |
```

---

## 📐 12. Hot Module Replacement (HMR) Detailed Flow

```
File Change        File Watcher            Compiler            Dev Server         Browser
    |                   |                      |                    |              |
    |-- save file ----->|-- detect change      |                    |              |
    |                   |                      |                    |              |
    |                   |-- trigger rebuild -->|                    |              |
    |                   |                      |-- compile -------->|              |
    |                   |                      |                    |-- WebSocket   |
    |                   |                      |<-- send delta ----->| msg -------->|
    |                   |                      |                    |              |
    |                   |                      |                    |-- __VITE_HMR
    |                   |                      |                    |-- handle update
    |                   |                      |                    |<-- module hot
    |                   |                      |                    |<-- accept ----
    |                   |                      |                    |-- rerender -->
    |                   |                      |                    |-- preserve -->
    |<-- Complete ------|                      |                    |<-- done ------>
    |                   |                      |                    |              |
```

---

## 📐 13. Data Flow Architecture (Genel Veri Mimarisi)

```
┌─────────────────────────────────────────────────────────────────┐
│                        ACK Framework                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  USER LAYER                                              │   │
│  │  ├─ .ack Files                                           │   │
│  │  ├─ User Interactions                                   │   │
│  │  └─ Configuration                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  CLI & SCAFFOLDING (@ack/cli)                            │   │
│  │  ├─ Project Creation                                     │   │
│  │  ├─ Template Selection                                  │   │
│  │  └─ Dependency Management                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  COMPILATION (@ack/compiler)                             │   │
│  │  ├─ Parser (TokenLexer, BlockParser)                    │   │
│  │  ├─ Analyzer (ReactivityAnalyzer, DependencyGraph)      │   │
│  │  └─ CodeGen (ESM, CJS, HydrationGen)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  VITE INTEGRATION (@ack/vite-plugin)                     │   │
│  │  ├─ Module Resolution                                    │   │
│  │  ├─ Hot Module Replacement                               │   │
│  │  └─ Development Server                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  RUNTIME (@ack/runtime)                                  │   │
│  │  ├─ Reactivity System (Proxy-based)                      │   │
│  │  ├─ Effects & Lifecycle                                 │   │
│  │  ├─ Component Mounting                                  │   │
│  │  └─ DOM Updates                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  FRAMEWORK (@ack/kit)                                    │   │
│  │  ├─ Dev Server                                           │   │
│  │  ├─ File-based Routing                                  │   │
│  │  ├─ Builder                                             │   │
│  │  └─ Build Optimization                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  OUTPUT LAYER                                            │   │
│  │  ├─ Development: Instant Updates (HMR)                  │   │
│  │  ├─ Production: Optimized JavaScript                    │   │
│  │  └─ Browser: Running Application                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📐 14. Reactivity System - State Change Propagation (Reaktivite Yayılımı)

```
User Changes State      Proxy Trap             Watchers            Components       DOM
    |                      |                    |                    |              |
    |-- state.count++ ----->|-- set trap fired  |                    |              |
    |                      |-- validate ------->|                    |              |
    |                      |<-- valid ---------|                    |              |
    |                      |                   |-- notify all ------>|              |
    |                      |                   |-- call callbacks -->|              |
    |                      |                   |<-- dependencies ----|              |
    |                      |                   |-- computed ------->|              |
    |                      |                   |<-- new value ------|              |
    |                      |                   |-- effects -------->|-- run ------->|
    |                      |                   |<-- cleanup --------|              |
    |                      |                   |-- render --------->|              |
    |                      |                   |                    |-- update ----|
    |                      |                   |                    |<-- display -->|
    |<-- propagation done ----|                |                    |              |
```

---

## 📐 15. Performance Optimization Flow (Performans Optimizasyonu)

```
Build Time              Analyzer               Tree Shaker          Bundler         Output
    |                      |                    |                    |              |
    |-- compile all ----->|                    |                    |              |
    |                     |-- dependency analysis                   |              |
    |                     |-- unused detection ->|-- mark dead ----->|              |
    |                     |<-- import graph ---| <-- remove --------|              |
    |                     |                    |                    |              |
    |                     |-- scope analysis -->|                    |              |
    |                     |-- hoist hoisting ---                    |              |
    |                     |                    |-- minify --------->|              |
    |                     |                    |-- compress ------->|              |
    |                     |                    |<-- optimized ------|              |
    |                     |-- bundle split ----->|                    |-- chunks   ->|
    |                     |<-- stats ----------|                    |<-- metrics-->|
    |<-- Complete --------|                    |                    |<-- ready --->|
```

---

## 📊 Component Lifecycle Diagram (Bileşen Yaşam Döngüsü)

```
┌─────────────────────────────────────────────────────────┐
│          COMPONENT LIFECYCLE                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. PARSE                                               │
│     ├─ Tokenization                                     │
│     ├─ Block Separation (script/template/style)        │
│     └─ AST Generation                                   │
│              ↓                                           │
│  2. ANALYZE                                             │
│     ├─ Reactive Variable Detection                     │
│     ├─ Dependency Mapping                              │
│     └─ Template Reference Analysis                      │
│              ↓                                           │
│  3. GENERATE                                            │
│     ├─ Scope Handling                                  │
│     ├─ Event Binding Generation                        │
│     └─ Style Scoping                                   │
│              ↓                                           │
│  4. OUTPUT                                              │
│     ├─ ESM/CJS Format                                  │
│     ├─ Source Maps                                     │
│     └─ Hydration Support                               │
│              ↓                                           │
│  5. MOUNT                                               │
│     ├─ Create Reactive State                           │
│     ├─ Setup Watchers                                  │
│     └─ Mount DOM                                        │
│              ↓                                           │
│  6. RUN                                                 │
│     ├─ Event Listeners                                 │
│     ├─ Watch Callbacks                                 │
│     └─ Effects Execution                               │
│              ↓                                           │
│  7. UPDATE (User Interaction)                           │
│     ├─ State Changes                                    │
│     ├─ Dependency Recalculation                        │
│     └─ DOM Patches                                      │
│              ↓                                           │
│  8. UNMOUNT                                             │
│     ├─ Effect Cleanup                                  │
│     ├─ Event Listener Removal                          │
│     └─ Garbage Collection                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Timeline (Zaman Çizelgesi)

```
Timeline    Dev Server       Compiler         Runtime           Browser           User
   0ms      [START]
  10ms      Read file ------>|
  15ms      Tokenize ------->|
  25ms      Parse/Analyze -->|
  35ms      Generate Code -->|
  40ms      Transform ------>|
  45ms      WebSocket Send -->|
  50ms                       |-- HMR Update -->|
  55ms                       |-- Patch vNodes->|
  60ms                       |-- Rerender ------>|-- Display
  65ms                       |-- Preserve State->|
  70ms      [COMPLETE]      |                    |       UI Updated <--
```

---

## 🎯 Request-Response Communication Protocol

```
┌─────────────────────────────────────────────────────────────────┐
│  HTTP/WebSocket Communication                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Initial Load:                                                   │
│  ├─ GET / → index.html (200 OK)                                │
│  ├─ GET /src/main.ts → transpiled JS (200 OK)                 │
│  ├─ GET /src/Button.ack → compiled JS (200 OK)               │
│  └─ Establish WS connection (101 Switching Protocols)         │
│                                                                   │
│  Development Updates (via WebSocket):                            │
│  ├─ File changes detected                                        │
│  ├─ Recompile → send delta                                       │
│  ├─ Browser receives: { type: 'update', module: '...', ... }   │
│  ├─ HMR handler processes                                        │
│  └─ UI updates without full reload                               │
│                                                                   │
│  Error Communication:                                            │
│  ├─ Compilation error → send to browser                          │
│  ├─ Browser: { type: 'error', message: '...', line: N }        │
│  ├─ Show overlay                                                 │
│  └─ Wait for fix                                                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Notlar

**Veriler Nereye Gidiyor:**
1. `.ack` dosyaları → Parser → Compiler → ES Modules
2. Template references → Analyzer → Reactivity tracking
3. State changes → Watchers → Effect callbacks → DOM updates
4. User interactions → Event handlers → State mutations → UI updates

**Olay Akışı:**
1. File save → Compilation → HMR notification → Browser update
2. User click → Event handler → State change → Watchers notify → Render → DOM patch
3. Error detection → Error overlay → Fix file → Recovery

**Optimizasyon Yolları:**
- Dependency analysis → Tree shaking → Bundle optimization
- Caching → Incremental compilation → Fast HMR
- Topological sorting → Efficient state updates

---

**Versiyon**: 0.0.1  
**Oluşturma Tarihi**: Ekim 2025  
**Dil**: Türkçe/İngilizce
