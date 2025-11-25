import classicBlinker from './patterns/classic/blinker.json';
import classicGlider from './patterns/classic/glider.json';
import classicLwss from './patterns/classic/lwss.json';
import classicPentadecathlon from './patterns/classic/pentadecathlon.json';
import classicPulsar from './patterns/classic/pulsar.json';
import continuousContinuousBloom from './patterns/continuous/continuous-bloom.json';
import continuousContinuousRippleBand from './patterns/continuous/continuous-ripple-band.json';
import continuousRippleCross from './patterns/continuous/ripple-cross.json';
import continuousSoftGlider from './patterns/continuous/soft-glider.json';
import continuousSpiralCore from './patterns/continuous/spiral-core.json';
import continuousQuartilesQuartileDoublePulse from './patterns/continuousQuartiles/quartile-double-pulse.json';
import continuousQuartilesQuartileGlider from './patterns/continuousQuartiles/quartile-glider.json';
import continuousQuartilesQuartileLantern from './patterns/continuousQuartiles/quartile-lantern.json';
import continuousQuartilesQuartileRacer from './patterns/continuousQuartiles/quartile-racer.json';
import continuousQuartilesQuartileRing from './patterns/continuousQuartiles/quartile-ring.json';
import finiteTemperatureThermalCrystal from './patterns/finiteTemperature/thermal-crystal.json';
import finiteTemperatureThermalGlider from './patterns/finiteTemperature/thermal-glider.json';
import finiteTemperatureThermalLoop from './patterns/finiteTemperature/thermal-loop.json';
import finiteTemperatureThermalRidge from './patterns/finiteTemperature/thermal-ridge.json';
import finiteTemperatureThermalWavefront from './patterns/finiteTemperature/thermal-wavefront.json';

const patternLibrary = {
    'classic': {
        [classicBlinker.name]: classicBlinker,
        [classicGlider.name]: classicGlider,
        [classicLwss.name]: classicLwss,
        [classicPentadecathlon.name]: classicPentadecathlon,
        [classicPulsar.name]: classicPulsar
    },
    'continuous': {
        [continuousContinuousBloom.name]: continuousContinuousBloom,
        [continuousContinuousRippleBand.name]: continuousContinuousRippleBand,
        [continuousRippleCross.name]: continuousRippleCross,
        [continuousSoftGlider.name]: continuousSoftGlider,
        [continuousSpiralCore.name]: continuousSpiralCore
    },
    'continuousQuartiles': {
        [continuousQuartilesQuartileDoublePulse.name]: continuousQuartilesQuartileDoublePulse,
        [continuousQuartilesQuartileGlider.name]: continuousQuartilesQuartileGlider,
        [continuousQuartilesQuartileLantern.name]: continuousQuartilesQuartileLantern,
        [continuousQuartilesQuartileRacer.name]: continuousQuartilesQuartileRacer,
        [continuousQuartilesQuartileRing.name]: continuousQuartilesQuartileRing
    },
    'finiteTemperature': {
        [finiteTemperatureThermalCrystal.name]: finiteTemperatureThermalCrystal,
        [finiteTemperatureThermalGlider.name]: finiteTemperatureThermalGlider,
        [finiteTemperatureThermalLoop.name]: finiteTemperatureThermalLoop,
        [finiteTemperatureThermalRidge.name]: finiteTemperatureThermalRidge,
        [finiteTemperatureThermalWavefront.name]: finiteTemperatureThermalWavefront
    }
};

export const getPatternsForMode = (modeKey = 'classic') => patternLibrary[modeKey] || patternLibrary['classic'] || {};

export default patternLibrary;
