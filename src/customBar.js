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
    }

    computeDataKeys() {
        let dataKeys = this.data
            .reduce((maxKeys, d) => maxKeys.length < Object.keys(d).length
            ? Object.keys(d)
            : maxKeys, []);
        this.dataKeys = dataKeys.filter(k => !this.hiddenKeys.includes(k));
    }

    computeFields() {
        // Extract complex and simple data fields
        let dataComplexFields = {}
        this.data.forEach(d => {
            Object.entries(d).forEach(([k, v]) =>{
                if (nonEmptyArray(v)) {
                    v.forEach(v => {
                        if (dataComplexFields[k]) {
                            if (v.level
                                && !dataComplexFields[k].includes(v.level)) {
                                dataComplexFields[k].push(v.level)
                            }
                        } else {
                            dataComplexFields[k] = v.level
                                    ? [v.level]
                                    : []
                        }
                    })
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

    drawDropdown(container, label, dropdownId) {
        const dropdown = container
            .append('div');
        // Dropdown toggler
        dropdown.append('a')
            .attr('class', 'btn-clean dropdown-toggle dropdown-noafter')
            .attr('role', 'button')
            .attr('id', dropdownId)
            .attr('data-toggle', 'dropdown')
            .attr('aria-expanded', 'false')
            .attr('aria-haspopup', 'true')
            .html(label);
        const dropdownMenu = dropdown
            .append('div')
            .attr('class', 
                  'dropdown-menu dropdown-menu-arrow clickoutside-dropdown')
            .attr('aria-labelledby', dropdownId)
            .append('div')
              .attr('class', 'dropdown-menu-content d-flex p-3')
        return dropdownMenu
    }

    drawSlider(container, label, sliderClass, options, formatter) {
        let sliderLabel = addLabel(container, label)
        let slider = container
            .append('div')
            .style('width', '160px')
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
            .attr('class', 'customBar col-md-10 mx-auto my-0 py-0 w-100');

        // Tree visualization
        const treeDropdown = this.drawDropdown(
            this.container.append('div'),
            "Tree visualization",
            "treeVizDropdown",
        );
        addCheckButton(
            treeDropdown,
            "Tree",
            "toggleTree",
            options.showTree,
        );
        if (this.treeFields) {
            let leafTextSelect = treeDropdown
                .append('div');
            addLabel(leafTextSelect,
                'Tree visualization')
            leafTextSelect = addCustomSelect(leafTextSelect,
                    'leafText',
                    'leafText');
            leafTextSelect.setChoices(
            [{ value: '', label: 'Leaf text', selected: true, disabled: true },
                ...this.treeFields.map(f => {
                    return { value : f, label : capitalize(f) }
                })
            ])
        }

        // Scaling
        const scalingDropdown = this.drawDropdown(
            this.container.append('div'),
            "Scaling",
            "scalingDropdown"
        );
        addCheckButton(
            scalingDropdown,
            "Scale",
            "scaleDist",
            options.scaleDist,
        );
        this.drawSlider(
            scalingDropdown
                .append('div')
                .attr('class', 'ml-3'),
            'Scaling zoom',
            'zoomSlider',
            {
                start : 1,
                step : 0.1,
                min : 0.1,
                max : 2
            },
            n => (+n).toFixed(1)
        );

        // Genes
        const genesDropdown = this.drawDropdown(
            this.container.append('div'),
            "Genes",
            "genesDropdown"
        );
        this.drawSlider(
            genesDropdown.append('div'),
            'Genes up/downstream',
            'nSideSlider',
            {
                start : 4,
                step : 1,
                min : 0,
                max : 10
            },
            n => Math.round(+n)
        );
        let geneTextSelect = genesDropdown
            .append('div');
        addLabel(geneTextSelect,
            'Show on gene');
        geneTextSelect = addCustomSelect(geneTextSelect,
                'geneText',
                'geneText');
        geneTextSelect.setChoices(
        [{ value: '', label: 'Gene text', selected: true, disabled: true },
            ...this.dataSimpleFields.map(f => {
                return { value : f, label : capitalize(f) }
            })
        ])

        // Legend
        const legendDropdown = this.drawDropdown(
            this.container.append('div'),
            "Legend",
            "legendDropdown"
        )
        addCheckButton(
            legendDropdown,
            "Legend",
            "toggleLegend",
            options.showLegend,
        )
        let annotationSelect = legendDropdown
            .append('div')
        addLabel(annotationSelect,
            'Color genes by')
            //.style('text-align', 'center');
        annotationSelect = addCustomSelect(annotationSelect,
                'annotation',
                'annotation')
        annotationSelect.setChoices(
        [{ value: '', label: 'Color', selected: true, disabled: true },
            ...this.dataKeys.map(k => {
                return { value : k, label : capitalize(k) }
            })
        ])

        let levelSelect = legendDropdown
            .append('div');
        addLabel(levelSelect,
            'Annotation level')
            //.style('text-align', 'center');
        this.levelSelect = addCustomSelect(levelSelect,
                'annotationLevel',
                'annotationLevel')
        this.levelSelect.setChoices([
            { value: '', label: 'Select level', selected: true, disabled: true }
        ])
        this.updateLevels('');

        let shuffleColors = legendDropdown
            .append('div');
        shuffleColors
            .append('button')
            .attr('class', 'shuffleColors btn-clean')
            .style('width', '7rem')
            .html('Shuffle colors');

        let downloadPng = this.container
            .append('div');
        downloadPng
            .append('button')
            .attr('class', 'downloadPng btn-clean')
            .html('Download image');

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
                menu.selectAll('.choices__item')
                    .each(function() {
                        select(this).on('click', () => 
                            menu.classed('show', false)
                        )
                    });
            })
    }

    updateLevels(annotation) {
        let levels = this.dataComplexFields[annotation] || [];
        this.levelSelect.clearChoices();
        this.levelSelect.setChoices(levels.map((l, idx) => {
            if (idx == 0) {
                return { value: l, label: capitalize(l), selected: true }
            }
            return { value: l, label: capitalize(l) }
        }))
        let levelSelect = this.container.select('select.annotationLevel');
        if (nonEmptyArray(levels)) levelSelect.attr('disabled', null);
        else levelSelect.attr('disabled', '');
    }
}

export default CustomBar
