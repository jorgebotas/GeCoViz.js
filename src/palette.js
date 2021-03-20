import { scaleOrdinal } from 'd3';
import colors269 from './colors269';
import { shuffle } from './helpers';

class Palette {
    constructor() {
        let colors = [
                "#abfdcb",
                "#c9b2fd",
                "#fcaf81",
                "#a9dff7",
                "#254F93",
                "#FF5C8D",
                "#838383",
                "#5F33FF",
                "#c7e3aa",
                "#D81E5B",
                "#47DAFF",
                "#c4ab77",
                "#A1A314",
                "#fff600",
                "#53257E",
                "#1e90ff",
                "#B6549A",
                "#7cd407",
                "#948ad6",
                "#7ba0d5",
                "#fcc6f8",
                "#fec24c",
                "#A40E4C",
                "#dd5a95",
                "#12982d",
                "#27bda9",
                "#F0736A",
                "#9354e7",
                "#cbd5e3",
                "#93605D",
                "#FFE770",
                "#6C9D7F",
                "#2c23e4",
                "#ff6200",
                "#406362"
                  ]
        this.colors = colors269;
        this.domain;
        this.palette;
        return this;
    }

    buildPalette(domain) {
        this.domain = domain;
        this.palette = scaleOrdinal()
            .domain(this.domain)
            .range(this.colors);
    }

    shuffle() {
        this.colors = shuffle([...this.colors]);
        this.buildPalette(this.domain);
    }

    get(query) {
        return this.palette(query);
    }
}

export default Palette;
