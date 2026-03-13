// Auto-generated from classic.json - patterns as RLE
const patterns = {
  'default': {
    'Block': {
      rle: 'x = 2, y = 2\n2o$2o!',
      description: 'The simplest still life, a 2×2 square.',
    },
    'Tub': {
      rle: 'x = 3, y = 3\nbo$obo$bo!',
      description: 'A diamond-shaped still life with 4 cells.',
    },
    'Boat': {
      rle: 'x = 3, y = 3\nbo$obo$2o!',
      description: 'A 5-cell still life resembling a small boat.',
    },
    'Ship': {
      rle: 'x = 3, y = 3\nb2o$obo$2o!',
      description: 'A 6-cell still life, a larger variant of the boat.',
    },
    'Beehive': {
      rle: 'x = 4, y = 3\nb2o$o2bo$b2o!',
      description: 'A 6-cell still life resembling a beehive.',
    },
    'Loaf': {
      rle: 'x = 4, y = 4\nb2o$o2bo$bobo$2bo!',
      description: 'A 7-cell still life resembling a loaf of bread.',
    },
    'Aircraft carrier': {
      rle: 'x = 4, y = 3\n2o$o2bo$2b2o!',
      description: 'A 6-cell still life consisting of two diagonal pre-blocks.',
    },
    'Block on table': {
      rle: 'x = 4, y = 5\n2o$2o$$4o$o2bo!',
      description: 'A 10-cell still life combining a block with a table structure.',
    },
    'Bi-block': {
      rle: 'x = 2, y = 5\n2o$2o$$2o$2o!',
      description: 'Two blocks separated by a single cell gap, the simplest pseudo still life.',
    },
    'Blinker': {
      rle: 'x = 1, y = 3\no$o$o!',
      description: 'A simple oscillator that switches between horizontal and vertical states.',
    },
    'Toad': {
      rle: 'x = 4, y = 2\nb3o$3o!',
      description: 'A period-2 oscillator with 6 cells that shifts back and forth.',
    },
    'Beacon': {
      rle: 'x = 4, y = 4\n2o$o$3bo$2b2o!',
      description: 'A period-2 oscillator composed of two diagonally adjacent blocks.',
    },
    'Glider': {
      rle: 'x = 3, y = 3\n3o$2bo$bo!',
      description: 'Iconic self-propelled pattern that moves diagonally across the grid.',
    },
    'Gosper glider gun': {
      rle: 'x = 36, y = 16\n27bo$26bobo$9b2o15b2obo4b2o$9bobo14b2ob2o3b2o$2o2b2o6bo13b2obo$2obo2bo2bo2bo13bobo$4b2o6bo8bo5bo$9bobo7bobo$9b2o9b2o$$$$$28bo$29bo$27b3o!',
      description: 'The first known gun and the first known finite pattern with unbounded growth. A true period 30 glider gun',
    },
    'Lightweight spaceship': {
      rle: 'x = 5, y = 4\no2bo$4bo$o3bo$b4o!',
      description: 'A very well-known period 4 c/2 orthogonal spaceship.',
    },
    'Middleweight spaceship': {
      rle: 'x = 6, y = 5\n2bo$o3bo$5bo$o4bo$b5o!',
      description: 'A very well-known period 4 c/2 orthogonal spaceship.',
    },
    'Heavyweight spaceship': {
      rle: 'x = 7, y = 5\n2b2o$o4bo$6bo$o5bo$b6o!',
      description: 'A very well-known period 4 c/2 orthogonal spaceship.',
    },
    'Copperhead': {
      rle: 'x = 10, y = 13\n4b2o$3b4o$$2b6o$3b4o$$2b2o2b2o$2obo2bob2o$3bo2bo$$$4b2o$4b2o!',
      description: 'c/10 orthogonal spaceship discovered by zdr on March 5, 2016.',
    },
    'Pentadecathlon': {
      rle: 'x = 10, y = 3\n2bo4bo$2ob4ob2o$2bo4bo!',
      description: 'Period-15 oscillator composed of a long spine and flanking boosters.',
    },
    'Pulsar': {
      rle: 'x = 13, y = 13\n2b3o3b3o$$o4bobo4bo$o4bobo4bo$o4bobo4bo$2b3o3b3o$$2b3o3b3o$o4bobo4bo$o4bobo4bo$o4bobo4bo$$2b3o3b3o!',
      description: 'A large oscillator with a period of 3 generations.',
    },
    'Garden of Eden': {
      rle: 'x = 16, y = 17\n8o2b3ob2o$b4ob3ob6o$3ob6ob4o$2ob3ob9o$b6ob6obo$16o$3ob9obo$o2b13o$b3ob6ob2obo$b15o$12ob3o$2ob4ob8o$ob2ob3ob6o$14o$b2ob3ob4ob3o$5ob5ob3o$6b3ob6o!',
      description: 'A Garden of Eden in Conway\'s Game of Life.',
    },
    'Vanishing reaction': {
      rle: 'x = 7, y = 4\nbo$2bo2bo$3obo$4b3o!',
      description: 'A Vanishing reaction in Conway\'s Game of Life.',
    },
    'Eater 1': {
      rle: 'x = 8, y = 7, rule = B3/S23\n2bo$obo$b2o$4b2o$4bobo$6bo$6b2o!',
      description: 'An eater 1 about to eat a glider.',
    },
    "NOT Gate": {
      rle: 'x = 49, y = 36, rule = B3/S23\n42b2o$42b2o6$obo$b2o$bo$42b3o$41bo3bo$40bo5bo$40bo5bo$8bo34bo$9b2o30bo\n3bo$8b2o32b3o$43bo3$44b3o$44b3o$43bo3bo$37bobo$37b2o3b2o3b2o$38bo4$23b\no$24b2o5bo$23b2o4b2o$30b2o2$44b2o$44b2o!',
      description: 'A NOT gate in Conway\'s Game of Life.',
    }
  },
};
export default patterns;
