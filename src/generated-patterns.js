import classicBlinker from './patterns/classic/blinker.json';
import classicPulsar from './patterns/classic/pulsar.json';
import continuousContinuousBloom from './patterns/continuous/continuous-bloom.json';
import continuousContinuousRippleBand from './patterns/continuous/continuous-ripple-band.json';

const patternLibrary = {
    'classic': {
        [classicBlinker.name]: classicBlinker,
        [classicPulsar.name]: classicPulsar
    },
    'continuous': {
        [continuousContinuousBloom.name]: continuousContinuousBloom,
        [continuousContinuousRippleBand.name]: continuousContinuousRippleBand
    }
};

export const getPatternsForMode = (modeKey = 'classic') => patternLibrary[modeKey] || patternLibrary['classic'] || {};

export default patternLibrary;
