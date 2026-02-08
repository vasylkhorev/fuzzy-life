// src/modes/LifeMode.js
/**
 * Base class used to enforce the public interface for every simulation mode.
 * Subclasses must implement both computeNextState and renderCell.
 */
export class LifeMode {
    constructor({ id, label, description, defaultParams = {}, parameterHelp = {}, rulesHtml = {}, translations = {} }) {
        if (new.target === LifeMode) {
            throw new Error('LifeMode is an abstract class and cannot be instantiated directly.');
        }
        if (!id) {
            throw new Error('Mode id is required.');
        }

        this.id = id;
        this.label = label || id;
        this.description = description || '';
        this.parameterHelp = parameterHelp;
        this.rulesHtml = rulesHtml;
        this.translations = translations;
        this.defaultParams = Object.freeze({ ...defaultParams });

        // Bind abstract methods so they can be passed around safely.
        this.computeNextState = this.computeNextState.bind(this);
        this.renderCell = this.renderCell.bind(this);
    }

    /**
     * Subclasses must implement this method.
     */
    // eslint-disable-next-line class-methods-use-this
    computeNextState() {
        throw new Error('computeNextState must be implemented by a mode subclass.');
    }

    /**
     * Subclasses must implement this method.
     */
    // eslint-disable-next-line class-methods-use-this
    renderCell() {
        throw new Error('renderCell must be implemented by a mode subclass.');
    }

    getDefaultParams() {
        return JSON.parse(JSON.stringify(this.defaultParams));
    }

    getInfo() {
        return {
            label: this.label,
            description: this.description,
            parameterHelp: this.parameterHelp,
        };
    }

    /**
     * Serialize grid cells to pattern format.
     * @param {Array<Array<number>>} grid - The grid to serialize
     * @param {boolean} includeZeros - Whether to include zero-value cells (for configurations)
     * @returns {Array} Array of cell data in mode-specific format
     */
    // eslint-disable-next-line class-methods-use-this
    serializeCells(grid, includeZeros = false) {
        throw new Error('serializeCells must be implemented by a mode subclass.');
    }

    /**
     * Parse pattern/configuration cells and return array of [row, col, value] tuples.
     * @param {Array} cells - Cell data in mode-specific format
     * @returns {Array<[number, number, number]>} Array of [row, col, value] tuples
     */
    // eslint-disable-next-line class-methods-use-this
    parseCells(cells) {
        throw new Error('parseCells must be implemented by a mode subclass.');
    }
}

export default LifeMode;
