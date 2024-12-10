import React, { useState, useRef } from 'react';
import Controls from './components/Controls';
import Main from "./components/Main";

const App = () => {
    const rows = 20;
    const cols = 20;
    const cellSize = 20;

    return (
        <div>
            <Main/>
            <Controls />
        </div>
    );
};

export default App;