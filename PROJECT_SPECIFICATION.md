# Project Specification: Fuzzy Life

## 1. Project Overview

"Fuzzy Life" is an interactive, web-based simulation of Conway's Game of Life and its many variants. The application provides a visual and interactive environment for exploring the emergent behavior of cellular automata. The "fuzzy" in the name refers to the inclusion of modes that use continuous states (e.g., values between 0 and 1) and probabilistic rules, as opposed to the strictly binary nature of the classic Game of Life.

The application is a single-page application (SPA) built with React. It features a pannable and zoomable grid, a variety of simulation modes, a library of predefined patterns, and the ability for users to save and load their own creations. The UI is designed to be intuitive and user-friendly, with clear controls and informative dialogs. The application is also internationalized, with support for English and Slovak.

## 2. Technology Stack

*   **Frontend Framework:** React
*   **Build Tool:** Create React App
*   **Styling:**
    *   Tailwind CSS: For utility-first CSS.
    *   Styled Components: For component-specific styles.
*   **State Management:**
    *   React Hooks (`useState`, `useEffect`, `useRef`, `useCallback`): For component-level state.
    *   Zustand: For global state management.
    *   RxJS: For managing complex asynchronous events.
*   **Graphics:** HTML5 Canvas API
*   **Internationalization:** `i18next` and `react-i18next`
*   **Other Libraries:**
    *   `react-draggable`: For draggable UI elements.
    *   `react-icons`: For icons.
    *   `canvas`: Node.js implementation of the Canvas API, likely for server-side rendering or testing.

## 3. Project Structure

The project is organized into the following main directories:

*   `public/`: Contains the main `index.html` file, favicons, and other static assets.
*   `src/`: The main source code directory.
    *   `assets/`: Contains static assets like images and SVGs.
    *   `components/`: Contains the React UI components.
    *   `i18n/`: Contains the internationalization configuration and language files.
    *   `modes/`: Contains the logic for the different simulation modes.
    *   `patterns/`: Contains the predefined patterns for each mode as JSON files.
    *   `wasm/`: A directory for WebAssembly modules (currently empty).
*   `build/`: The output directory for the production build.

## 4. Application Architecture

The application is centered around the `App.js` component, which manages the main state of the application and orchestrates the interactions between the various components.

The core of the application is the simulation loop, which is managed in `App.js`. The `nextGeneration` function calculates the next state of the grid by iterating over each cell and applying the `computeNextState` function of the currently active `mode`. The grid is then re-rendered on the canvas.

The application's state is managed using a combination of React hooks and Zustand. The main `App` component holds the state for the grid, the simulation status (running or paused), the current mode, and the UI state (e.g., whether the menus are open).

## 5. Simulation Modes

The application features a variety of simulation modes, each with its own unique rules and behavior. All modes extend the abstract `LifeMode` class, which defines a common interface for computing the next state of a cell, rendering a cell, and serializing/deserializing patterns.

The available modes are:

*   **Classic:** The standard Conway's Game of Life with binary states and the B3/S23 rule set.
*   **Continuous:** A "fuzzy" version of the Game of Life where cells have a continuous state between 0 and 1. The rules are based on the sum of neighbor intensities.
*   **1D:** A one-dimensional cellular automaton that implements Wolfram's outer totalistic rules.
*   **Half-Life:** A three-state mode with discrete cell values of 0, 0.5, and 1. The rules are a "renormalized" version of Conway's rules.
*   **Custom Half-Life:** A customizable version of `halfLife.js` where the birth and survival thresholds can be adjusted.
*   **Quartiles:** A five-state mode with discrete cell values of 0, 0.25, 0.5, 0.75, and 1.
*   **Finite Temperature:** A continuous-state model based on a logistic energy function from a physics paper, which creates a "smeared" or "fuzzy" version of the Game of Life.

Each mode has a corresponding file in the `src/modes` directory that contains its implementation, including the `computeNextState` and `renderCell` methods, as well as its default parameters and a detailed description of its rules in HTML format (with MathJax for formulas).

## 6. Patterns and Configurations

The application has a system for loading, saving, and managing patterns and configurations.

*   **Patterns:** A pattern is a small, predefined arrangement of cells that can be placed on the grid. Patterns are stored as JSON files in the `src/patterns` directory, organized into subdirectories by mode. The `generate_patterns.js` script automatically imports all these patterns and makes them available to the application. Users can also save the current state of the grid as a custom pattern, which is stored in the browser's `localStorage`.

*   **Configurations:** A configuration is a snapshot of the entire grid, including the state of every cell. Users can save the current grid as a configuration and load it back later. Configurations are also stored in `localStorage`. Users can also import and export configurations as JSON files.

## 7. UI Components

The UI is built from a set of reusable React components:

*   **`Grid.js` / `Grid1D.js`**: The main interactive canvas for the simulation.
*   **`Controls.js`**: The draggable control panel for the simulation.
*   **`Menu.js`**: The slide-out menu for managing patterns and configurations.
*   **`ModeMenu.js`**: The slide-out menu for selecting and configuring simulation modes.
*   **`HelpDialog.js`**: A dialog with help information and keyboard shortcuts.
*   **`RulesDialog.js`**: A dialog that displays the rules for the selected simulation mode.
*   **`LanguageSwitcher.js`**: A component for changing the application's language.

## 8. Build and Configuration

The project is built using `create-react-app`, with some customizations:

*   **`package.json`**: Defines the project's dependencies and scripts. The `start` and `build` scripts are customized to run `generate_patterns.js` before starting the development server or building the application.
*   **`generate_patterns.js`**: A script that automatically generates a module that imports all the pattern files.
*   **`src/config.js`**: Contains application-level configuration constants, such as the grid size and the content for the help dialog.
*   **`tailwind.config.js`**: The configuration file for Tailwind CSS.

## 9. Internationalization

The application is internationalized using `i18next` and `react-i18next`.

*   The language files are located in `src/i18n/index.js`.
*   The `useTranslation` hook is used throughout the components to get translated strings.
*   The `LanguageSwitcher` component allows the user to switch between the supported languages (currently English and Slovak).
*   The content for the help and rules dialogs, as well as the labels and descriptions for the modes and patterns, are all internationalized.

## 10. Formal Mode Definitions

This section provides the formal mathematical and algorithmic definitions for each of the simulation modes.

### 10.1. Classic Mode

*   **Overview:** Conway's Game of Life uses binary states with synchronous updates over an eight-neighbor (Moore) lattice. Cells are either alive (1) or dead (0).
*   **State Space:** `G(i, j) ∈ {0, 1}`
*   **Neighborhood:** The neighborhood of a cell is the 8 adjacent cells (Moore neighborhood). The number of live neighbors is `N_t(i, j)`.
*   **Transition Rule:**
    ```
      G_{t+1}(i,j) =
      \begin{cases}
        1 & \text{if } (G_t(i,j)=0 \land N_t=3) \lor (G_t(i,j)=1 \land N_t \in \{2,3\}) \\
        0 & \text{otherwise}
      \end{cases}
    ```
*   **Parameters:** None.

### 10.2. Continuous Mode

*   **Overview:** Each cell stores an intensity `G(i, j) ∈ [0, 1]`. The rules are based on Conway's B3/S23 targets, but values blend instead of flipping between 0 and 1.
*   **State Space:** `G(i, j) ∈ [0, 1]`
*   **Neighborhood:** The neighborhood sum `S` is the sum of the intensities of the 8 neighboring cells.
*   **Transition Rule:** The transition is determined by a set of heuristics:
    *   If `S < 2` or `S > 3` (underpopulation/overpopulation), the cell decays: `G_{t+1} = G_t * decay`.
    *   If `2 <= S <= 3` and the cell is "alive" (`G_t >= 0.5`), it moves toward a steady intensity: `G_{t+1} = G_t + (survivalTarget - G_t) * sustainPull`.
    *   If `2 <= S <= 3` and the cell is "dead" (`G_t < 0.5`), it blends with the neighbors: `G_{t+1} = G_t * (1 - blend) + neighborAverage * blend`.
    *   If the cell is "dead" and `S` is close to 3, a birth is pushed: `G_{t+1} = max(G_{t+1}, G_t + (birthTarget - G_t) * birthPush * birthStrength)`.
*   **Parameters:**
    *   `decay`: How much a cell fades when the neighbor sum is outside the survival range.
    *   `sustainPull`: How fast alive cells are pulled toward their target intensity.
    *   `birthPush`: How strongly dead cells are pushed upward when the neighbor sum is close to 3.

### 10.3. 1D Mode

*   **Overview:** A one-dimensional cellular automaton with a five-cell neighborhood (YYXYY).
*   **State Space:** `X_t ∈ {0, 1}`
*   **Neighborhood:** The neighborhood consists of the 4 cells at offsets -2, -1, 1, 2 from the current cell. `N_Y` is the number of live neighbors.
*   **Transition Rule (Rule 624):**
    ```
      X_{t+1} =
      \begin{cases}
        1 & \text{if } (X_t = 0 \land N_Y \in \{2,3\}) \lor (X_t = 1 \land N_Y \in \{2,4\}) \\
        0 & \text{otherwise}
      \end{cases}
    ```
*   **Parameters:**
    *   `rule`: The outer totalistic rule code (default: 624).

### 10.4. Half-Life Mode

*   **Overview:** A three-state mode where cells transition between 0, 0.5, and 1. The rules are based on an integer renormalization of Conway's rules.
*   **State Space:** `G(i, j) ∈ {0, 0.5, 1}`, internally mapped to `{0, 1, 2}`.
*   **Neighborhood:** The integer neighbor sum `σ_t(x, y)` is the sum of the integer states of the 8 neighboring cells.
*   **Transition Rule:**
    *   **Target Function:**
        ```
          \tau(\sigma, C) = \begin{cases} 2 & \text{if } \sigma \in \{5, 6\} \quad \text{(Birth equivalent)} \\ 2 & \text{if } \sigma \in \{3, 4\} \text{ AND } C \ge 1 \quad \text{(Survival equivalent)} \\ 0 & \text{otherwise} \end{cases}
        ```
    *   **Transition:** The cell moves one step towards the target state.
        ```
          C_{t+1} = \begin{cases} C_t + 1 & \text{if } \tau(\sigma, C_t) > C_t \\ C_t - 1 & \text{if } \tau(\sigma, C_t) < C_t \\ C_t & \text{if } \tau(\sigma, C_t) = C_t \end{cases}
        ```
*   **Parameters:** None.

### 10.5. Custom Half-Life Mode

*   **Overview:** A customizable version of the Half-Life mode.
*   **State Space:** Same as Half-Life mode.
*   **Neighborhood:** Same as Half-Life mode.
*   **Transition Rule:** Same as Half-Life mode, but the birth and survival intervals in the target function are customizable.
*   **Parameters:**
    *   `birthMin`, `birthMax`: The min/max integer neighbor sum for birth.
    *   `survivalMin`, `survivalMax`: The min/max integer neighbor sum for survival.

### 10.6. Quartiles Mode

*   **Overview:** A five-state mode where cell intensity moves along five quartile levels: 0, 0.25, 0.5, 0.75, 1.
*   **State Space:** `G(i, j) ∈ {0, 0.25, 0.5, 0.75, 1}`
*   **Neighborhood:** The neighbor sum is the sum of the snapped quartile values of the 8 neighboring cells. The approximate neighbor count is `approxNeighbors = round(neighborSum)`.
*   **Transition Rule:**
    *   The "target" state (alive or dead) is determined by the standard B3/S23 rules applied to `approxNeighbors`.
    *   The cell's value then moves one step (0.25) towards the target state.
*   **Parameters:** None.

### 10.7. Finite Temperature Mode

*   **Overview:** A continuous-state model based on a logistic energy function.
*   **State Space:** `S_ij ∈ [0, 1]`
*   **Neighborhood:** The neighbor sum `n_ij` is the sum of the intensities of the 8 neighboring cells.
*   **Transition Rule:** The next state is calculated using the following equations:
    ```
      x_{ij}(t) = S_{ij}(t) + 2 n_{ij}(t)
      E_{ij}(t) = E_0 - (x_{ij}(t) - x_0)^2
      S_{ij}(t+1) = \dfrac{1}{1 + e^{-2E_{ij}/T}}
    ```
*   **Parameters:**
    *   `temperature (T)`: The amount of thermal smearing.
    *   `energyShift (E0)`: A constant offset to the cell energy.
    *   `stateShift (x0)`: A horizontal shift of the argument before energy is computed.

