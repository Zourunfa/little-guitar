# 🎸 Little Guitar

**A comprehensive Blues improvisation guitar learning and practice web application**

Video: https://www.bilibili.com/video/BV1RC1GB6EUi/?spm_id_from=333.1387.homepage.video_card.click

**Live Demo**: [https://littleguitar.pages.dev/#/blues](https://littleguitar.pages.dev/#/blues)

Todo:
- [ ] Guitar fretboard zoom functionality
- [x] Countdown synchronized with tempo speed
- [x] Classic audio backing track preload to prevent timing issues
- [x] Backend-free page visit statistics

---

## ✨ Features

### 🎹 Blues Improvisation Practice

Full-featured Blues practice system with complete virtual band accompaniment:

#### 🎼 Scale Practice
- **Three Blues Scales**: Minor Blues, Major Blues, Mixolydian
- **12 Key Selection**: Support for all major and chromatic keys
- **Visual Fretboard**: Real-time scale position display with root note highlighting
- **Note Labels**: Clear display of each note position on the fretboard
- **Fret Markers**:
  - Dual fret number markers (top and bottom)
  - Special frets (3, 5, 7, 9, 12, 15, 17, 19) highlighted in yellow
  - Clear fret range display

#### 🎹 Chord Progression Practice
- **Standard 12-bar Blues**: Classic I-IV-V progression
- **Quick 6-bar Progression**: Perfect for quick practice sessions
- **Real-time Chord Display**: Current chord highlighted
- **BPM Speed Control**:
  - Slider adjustment (60-180 BPM)
  - 6 quick preset buttons (60/80/100/120/140/160)
  - Real-time beat indicator
  - Speed description hints (Slow/Medium/Fast/Very Fast)

#### 🥁 Drum Rhythms
- **Three Rhythm Patterns**:
  - Shuffle: Blues swing rhythm
  - Standard: Standard 4/4 beat
  - Slow Blues: Slow Blues pattern
- **Independent Volume Control**: 0-100% adjustable
- **Real-time Beat Display**: 4-beat visual indicator

#### 🎺 Blues Accompaniment System
- **🎹 Native Synthesized Accompaniment**:
  - **🎵 Harmonica Accompaniment**:
    - Simulates authentic harmonica tone (multi-oscillator synthesis + LFO vibrato)
    - Plays Blues riffs on strong beats (1, 3)
    - Independent volume control
  - **🎸 Guitar Accompaniment**:
    - Karplus-Strong algorithm simulates plucked string tone
    - Automatically follows chord progression
    - Supports strumming and muted effects
    - Auto-generates dominant 7th chords
    - Independent volume control
- **🎸 Classic Audio Backing Tracks** (New):
  - Uses real recorded Blues backing tracks
  - **Smart Preload**: Auto-preloads all available audio on page load for zero-delay playback
  - **Real-time Speed Adjustment**: Automatically adjusts playback speed based on BPM (0.5x-2.0x)
  - **Seamless Loop Playback**: Supports setting loop start/end points
  - **Visual Status**: Green dot indicates preloaded keys
  - Supports 12 keys (currently configured for A key)

#### 🎵 Rhythm Training
- Multiple Blues rhythm pattern exercises
- Metronome functionality
- Adjustable BPM

#### ✨ Improvisation
- Comprehensive practical exercises
- Integration of scales, chords, and rhythm

### 🎼 Chord Finder

Rich chord library with fingering diagrams:

- **Common Chord Fingerings**: Major, minor, seventh chords, and more
- **Interactive Fretboard Display**: Clear visual fingering diagrams
- **Multi-dimensional Filtering**: Quick search by chord type and root note
- **Alternative Fingerings**: Multiple playing options provided

### 🎵 Guitar Tuner

Precise real-time tuning tool to help you quickly tune your guitar:

- **Real-time Audio Analysis**: Accurate pitch detection using Web Audio API + FFT algorithm
- **Standard Tuning Support**: Supports 6-string standard tuning (E2, A2, D3, G3, B3, E4)
- **Visual Feedback**:
  - Real-time frequency display
  - Cent deviation indicator (±50 cent range)
  - Color-coded accuracy hints (Green=Perfect, Yellow=Close, Red=Off)
- **Smart Recognition**: Automatically identifies the closest note and shows adjustment direction
- **Historical Data Tracking**: Records tuning process for analysis

### 📊 Page Visit Statistics (New)

Local visit statistics without backend database:

- **Real-time Stats**: Automatically records visit count for each page
- **Visitor Analysis**:
  - Total visit count
  - Visited pages count
  - Session count (30-minute timeout)
  - Today's visit count
- **Popular Pages Ranking**: Top 5 pages by visit count
- **Time Tracking**: Records first and last visit times
- **Data Management**:
  - Export statistics data (JSON format)
  - Clear all statistics data
  - Data import/restore functionality
- **Privacy Protection**: All data stored in browser's local localStorage, not uploaded to server
- **Floating Display**: Bottom-right floating button, click to expand detailed statistics panel

---

## 🛠️ Tech Stack

### Core Technologies
- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router 6 (HashRouter)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion

### Audio Technologies
- **Web Audio API**: Real-time audio processing and analysis
- **FFT Algorithm**: Frequency domain analysis and pitch detection
- **HPS Algorithm**: Harmonic Product Spectrum for precise fundamental frequency detection
- **Audio Synthesis**:
  - Oscillator
  - Gain Control
  - BiquadFilter
  - LFO (Low Frequency Oscillator)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 14+
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Local Development

```bash
npm run dev
```

Visit `http://localhost:5173` to view the application

### Build for Production

```bash
npm run build
```

Build output will be in the `dist` directory

---

## 📖 User Guide

### 🎵 Using the Tuner

1. Click the navigation bar to enter the "Tuner" page
2. Click the "Start Tuning" button (browser will request microphone permission)
3. Select the string to tune (strings 1-6)
4. Play the corresponding string and observe:
   - **Frequency Display**: Currently detected frequency
   - **Note Display**: Closest note
   - **Pointer Position**: Left=too low, Right=too high, Center=accurate
   - **Color Hints**: Green=perfect, Yellow=close, Red=needs adjustment
5. Adjust string tension according to the indicator until the pointer is centered and shows green

### 🎹 Using Blues Practice

1. Enter the "Blues Improvisation" page
2. Select practice mode:
   - **Chord Progression**: Practice Blues chord changes
   - **Scale Practice**: Learn Blues scale positions
   - **Rhythm Training**: Develop rhythm sense
   - **Improvisation**: Comprehensive practice

#### Chord Progression Practice Steps:
1. Select key (A, C, E, G, etc.)
2. Select progression type (12-bar/6-bar)
3. Adjust BPM speed (beginners recommended to start from 60-80)
4. Configure accompaniment:
   - Enable drums, select rhythm pattern
   - Optional: Enable harmonica accompaniment
   - Optional: Enable guitar accompaniment
5. Click "Play" to start practice
6. Follow the highlighted chord prompts to play

### 🎼 Using Chord Finder

1. Enter the "Chord Finder" page
2. Select root note (C, D, E, etc.)
3. Select chord type (major, minor, seventh, etc.)
4. View fingering diagram:
   - Black dots indicate finger positions
   - Numbers indicate which finger to use
   - X indicates don't play that string
   - O indicates open string
5. View chord composition information

---

## 🌐 Language Support

The application supports automatic language detection based on IP address:
- **China (CN) and Taiwan (TW)**: Chinese interface
- **Other regions**: English interface
- Users can manually switch languages using the language switcher in the top-right corner

---

## 📝 License

MIT License

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

## 👨‍💻 Author

Feel free to reach out for questions or suggestions!
