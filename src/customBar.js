import { select } from 'd3';
import {
    addCheckButton,
    addCustomSelect,
    addLabel,
    capitalize,
    nonEmptyArray,
} from './helpers';
import createSlider from './slider';

class CustomBar {
    constructor(data, treeFields) {
        this.container;
        this.data = data;
        this.dataKeys;
        this.hiddenKeys = [
            'anchor',
            'pos',
            'start',
            'end',
            'size',
            'strand',
            'vStart',
            'vEnd',
            'vSize',
        ]
        this.computeDataKeys();
        this.dataSimpleFields;
        this.dataComplexFields;
        this.treeFields = treeFields;
        this.computeFields();
        this.levelSelect;
        this.levelSelectContainer;
    }

    computeDataKeys() {
        const dataKeys = this.data
            .reduce((maxKeys, d) => maxKeys.length < Object.keys(d).length
            ? Object.keys(d)
            : maxKeys, []);
        this.dataKeys = dataKeys.filter(k => !this.hiddenKeys.includes(k));
    }

    computeFields() {
        // Extract complex and simple data fields
        const dataComplexFields = {}
        this.data.forEach(d => {
            Object.entries(d).forEach(([k, v]) => {
                if (nonEmptyArray(v)) {
                    v.forEach(v => {
                        if (dataComplexFields[k]) {
                            if (v.level
                                && !dataComplexFields[k].filter(d => d.id == v.level).length) {
                                dataComplexFields[k].push({ id: v.level, name: (v.levelName || v.level) })
                            }
                        } else {
                            dataComplexFields[k] = v.level
                                    ? [{ id: v.level, name: v.levelName || v.level }]
                                    : []
                        }
                    })
                    dataComplexFields[k].sort((a, b) => +a.id - +b.id);
                }
            })
        })
        this.dataComplexFields = dataComplexFields;
        this.dataSimpleFields = this.dataKeys
            .filter(d => !Object.keys(this.dataComplexFields).includes(d));
    }

    getLevels(annotation) {
        return this.dataComplexFields[annotation]
    }

    drawDropdown(container, label, dropdownId, end=false) {
        const dropdown = container
            .append('div');
        // Dropdown toggler
        dropdown.append('a')
            .attr('class', 'btn-clean dropdown-toggle dropdown-noafter f-bold')
            .attr('role', 'button')
            .attr('id', dropdownId)
            .attr('data-toggle', 'dropdown')
            .attr('aria-expanded', 'false')
            .attr('aria-haspopup', 'true')
            .html(label + " <i class='fas fa-chevron-down ml-2'></i>");
        const dropdownMenuClass = 'dropdown-menu dropdown-menu-arrow' 
            + ' clickoutside-dropdown'
            + (end ? ' dropdown-menu-right' : '')
        const dropdownMenu = dropdown
            .append('div')
            .attr('class', dropdownMenuClass)
            .attr('aria-labelledby', dropdownId)
            .append('div')
              .attr('class', 'dropdown-menu-content p-3')
        return dropdownMenu
    }

    drawSlider(container, label, sliderClass, options, formatter) {
        const sliderLabel = addLabel(container, label, 1)
        let slider = container
            .append('div')
            .style('width', '175px')
            .style('margin-top', '1.6rem')
            .style('margin-bottom', '.9rem');
        createSlider(slider, sliderClass, options)
        slider = this.container
            .select(`.${sliderClass}`)
            .node()
            .noUiSlider;
        slider.on('update', () => {
            sliderLabel.html(`${label}: ${formatter(slider.get())}`);
        })
    }

    drawBar(selector, options) {

        this.container = select(selector)
            .append('div')
            .attr('class', 'customBar col-md-10 mx-auto my-0 py-0 w-100')

        // Tree visualization
        const treeTogglerContainer = this.container
            .append('div')
            .attr("class", "mr-auto btn-group split-btn-group")
            .style("margin-top", "1.7rem");

        const treeDropdown = this.drawDropdown(
            treeTogglerContainer,
            "Tree visualization",
            "treeVizDropdown",
        );

        treeTogglerContainer
            .append("div")
            .append("button")
            .attr("class", "btn-clean toggleTree")
            .append("i")
            .attr("class", () => "fas fa-" + 
                (options.showTree ? "times" : "plus"));

        const treeDropdownButtons = treeDropdown
            .append("div")
            .attr("class", "d-flex")
            .style("min-width", "350px");
        addCheckButton(
            treeDropdownButtons,
            "Shrink width",
            "shrinkTreeWidth",
            options.shrinkTreeWidth,
        );
        addCheckButton(
            treeDropdownButtons,
            "Branch length",
            "branchLength",
            options.branchLength,
        );
        addCheckButton(
            treeDropdownButtons,
            "Branch support",
            "branchSupport",
            options.branchSupport,
        );
        if (this.treeFields) {
            let leafTextSelect = treeDropdown
                .append('div')
                .attr("class", "mt-4");
            addLabel(leafTextSelect,
                'Text on leaf')
            leafTextSelect = addCustomSelect(leafTextSelect,
                    'leafText',
                    'leafText');
            leafTextSelect.setChoices(
            [{ value: '___', label: 'Off', selected: false },
             ...this.treeFields.map(f => {
                return { value : f, label : capitalize(f), 
                         selected: f === options.leafText }
                })
            ])
        }

        // Scaling
        const scalingDropdown = this.drawDropdown(
            this.container.append('div')
                .style("margin-top", "1.7rem"),
            "Genomic context visualization",
            "scalingDropdown"
        );
        const scalingDropdownButtons = scalingDropdown
            .append("div")
            .attr("class", "d-flex");
        addCheckButton(
            scalingDropdownButtons,
            "Scale by length",
            "scaleDist",
            options.scaleDist,
        );
        addCheckButton(
            scalingDropdownButtons,
            "Collapse height",
            "collapseHeight",
            options.collapseHeight,
        );
        this.drawSlider(
            scalingDropdown
                .append('div')
                .attr('class', 'ml-3 mt-4'),
            'Scaling zoom',
            'zoomSlider',
            {
                start : options.zoom,
                step : 0.1,
                min : 0.1,
                max : 2
            },
            n => (+n).toFixed(1)
        );

        // Neighbors
        //const neighborsDropdown = this.drawDropdown(
            //this.container.append('div'),
            //"Neighbors",
            //"neighborsDropdown"
        //);
        this.drawSlider(
            scalingDropdown.append('div').attr("class", 'ml-3 mt-4'),
            'Genes upstream',
            'nSideSliderUp',
            {
                start : options.nSide.up,
                step : 1,
                min : 0,
                max : 10
            },
            n => Math.round(+n)
        );
        this.drawSlider(
            scalingDropdown.append('div').attr("class", 'ml-3 mt-4'),
            'Genes downstream',
            'nSideSliderDown',
            {
                start : options.nSide.down,
                step : 1,
                min : 0,
                max : 10
            },
            n => Math.round(+n)
        );
        let geneTextSelect = scalingDropdown
            .append('div')
            .attr("class", "mt-4");
        addLabel(geneTextSelect,
            'Text on gene');
        geneTextSelect = addCustomSelect(geneTextSelect,
                'geneText',
                'geneText');
        geneTextSelect.setChoices(
        [{ value: '', label: 'Gene text', selected: true, disabled: true },
            ...this.dataSimpleFields.map(f => {
                return { value : f, label : capitalize(f), selected: f === options.geneText }
            })
        ])

        this.drawSlider(
            this.container
                .append('div'),
            'Conservation threshold',
            'conservationSlider',
            {
                start : options.conservationThreshold,
                step : 0.01,
                min : 0.0,
                max : 1
            },
            n => (+n).toFixed(2)
        );
        
        // Gene color
        let annotationSelect = this.container
            .append('div');
        addLabel(annotationSelect,
            'Color genes by')
            //.style('text-align', 'center');
        annotationSelect = addCustomSelect(annotationSelect,
                'annotation',
                'annotation')
        annotationSelect.setChoices(
            this.dataKeys.map(k => {
                return { value : k, label : capitalize(k), selected: k === options.annotation }
            }))

        this.levelSelectContainer = this.container
            .append('div');
        addLabel(this.levelSelectContainer,
            'Annotation level')
            //.style('text-align', 'center');
        this.levelSelect = addCustomSelect(this.levelSelectContainer,
                'annotationLevel',
                'annotationLevel')
        this.levelSelect.setChoices([
            { value: '', label: 'Select level', selected: true, disabled: true }
        ])
        this.updateLevels('');


        // Legend
        const legendTogglerContainer = this.container.append('div')
                .attr("class", "ml-auto mr-0 btn-group split-btn-group")
                .style("margin-top", "1.7rem");

        legendTogglerContainer
            .append('button')
            .attr('class', 'shuffleColors btn-clean f-bold')
            .style('width', '7rem')
            .html('Shuffle colors');

        legendTogglerContainer
            .append("div")
            .append("button")
            .attr("class", "btn-clean toggleLegend")
            .append("i")
            .attr("class", () => "fas fa-" + 
                (options.showLegend ? "times" : "plus"));

        //const legendDropdown = this.drawDropdown(
            //legendTogglerContainer,
            //"Legend control panel",
            //"legendDropdown",
            //true,
        //)

        //const legendDropdownButtons = legendDropdown
            //.append("div")
            //.attr("class", "d-flex mb-4");

        //addCheckButton(
            //legendDropdownButtons,
            //"Split legend",
            //"splitLegend",
            //options.splitLegend,
        //);


        //const downloadPng = this.container
            //.append('div');
        //downloadPng
            //.append('button')
            //.attr('class', 'downloadPng btn-clean')
            //.html('Download image');

        // Deal with choices and dropdowns not working properly
        this.container
            .selectAll('.clickoutside-dropdown')
            .on('click', e => e.stopPropagation())
        this.container
            .selectAll('.choices')
            .each(function() {
                const choices = select(this);
                const menu = choices.select('.dropdown-menu');
                choices.on('click', () => {
                    menu.classed('show', !menu.classed('show'));
                    if (menu.classed('show'))
                        choices.node().focus()
                    else
                        choices.node().blur()
                })
                choices.on('change', () => menu.classed('show', false));
            })
    }

    updateLevels(annotation, annotationLevel) {
        const levels = this.dataComplexFields[annotation] || [];
        this.levelSelect.clearChoices();
        this.levelSelect.setChoices(levels.map((l, idx) => {
            const selected = (!annotationLevel && idx == 0) 
                || (annotationLevel && l.id == annotationLevel);
            return { value: l.id, label: capitalize(l.name), selected: selected }
        }))
        if (nonEmptyArray(levels))
            this.levelSelectContainer
                .style("pointer-events", "all")
                .style("opacity", 1);
        else 
            this.levelSelectContainer
                .style("pointer-events", "none")
                .style("opacity", 0.5);
    }
}

export default CustomBar
