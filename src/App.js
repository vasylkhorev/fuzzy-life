import React, { useState, useRef } from 'react';
import Controls from './components/Controls';
import Grid from "./components/Grid";

const App = () => {
    return (
        <div>
            <Grid/>
            <Controls />
        </div>
    );
};

export default App;