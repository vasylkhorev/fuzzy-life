// Auto-generated from finiteTemperature.json - patterns as RLE
const patterns = {
  'default': {
    'Thermal Crystal': {
      rle: 'x = 5, y = 5\n2bo$b3o$2ob2o$b3o$2bo!',
      description: 'Symmetric seed that forms a crystalline pulse with temperature-dependent edges.',
    },
    'Thermal Glider': {
      rle: 'x = 3, y = 3\nbo$2bo$3o!',
      description: 'A glider starter tuned for the finite-temperature rule; drift varies with T.',
    },
    'Thermal Loop': {
      rle: 'x = 5, y = 5\nb3o$o3bo$obobo$o3bo$b3o!',
      description: 'Hollow ring with a warm core that oscillates as energy redistributes.',
    },
    'Thermal Ridge': {
      rle: 'x = 5, y = 3\n2bo$5o$2bo!',
      description: 'Horizontal spine with a vertical spur; throws off ridges that depend on T and energy shifts.',
    },
    'Thermal Wavefront': {
      rle: 'x = 4, y = 3\n2b2o$3o$2b2o!',
      description: 'Asymmetric front that often emits angled waves whose spread is sensitive to temperature.',
    },
  },
};
export default patterns;
