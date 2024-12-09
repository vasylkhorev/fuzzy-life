import React, { useState, useRef } from 'react';
import Grid from './components/Grid';
import Controls from './components/Controls';

const App = () => {
  const rows = 20;
  const cols = 20;
  const cellSize = 20;

  return (
    <div>
      <h1>Game of Life</h1>
      <Grid rows={rows} cols={cols} cellSize={cellSize} />
      <Controls />
    </div>
  );
};

export default App;
