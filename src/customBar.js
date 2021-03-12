class CustomBar {
    constructor(selector, data) {
        this.selector = selector;
        this.container;
        this.data = data;
        this.dataKeys;
        this.computeDataKeys();
        this.dataSimpleFields;
        this.dataComplexFields;
        this.computeFields();
        this.levelSelect;
    }

    computeDataKeys() {
        this.dataKeys = this.data
            .reduce((maxKeys, d) => maxKeys.length < Object.keys(d).length
            ? Object.keys(d)
            : maxKeys, []);
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
            .filter(d => !Object.keys(dataComplexFields).includes(d));
    }

    getLevels(notation) {
        return this.dataComplexFields[notation]
    }

    drawBar() {
        let vis = d3.select(this.selector);
        this.container = vis.append('div')
                .attr('class', 'customBar col-md-10 mx-auto my-0 py-0');

        let checkButtonContainer = this.container
            .append('div')
        checkButtonContainer = checkButtonContainer
            .append('div')
            .attr('class', 'd-flex')
            .style('margin-top', '12%');
        let checkButtons = [
            { label : 'Tree', class : 'toggleTree' },
            { label : 'Legend', class : 'toggleLegend' },
        ]
        checkButtons.forEach(cbutton => {
            addCheckButton(checkButtonContainer, cbutton.label, cbutton.class)
        })

        let nSideSlider = this.container
            .append('div');
        let nSideSliderLabel = addLabel(nSideSlider,
            'Genes up/downstream')
        nSideSlider = nSideSlider
            .append('div')
            .style('width', '200px')
            .style('margin-top', '1rem');
        createSlider(nSideSlider,
            'nSideSlider',
            {
                start : 10,
                step : 1,
                min : 0,
                max : 10
            })
        nSideSlider = d3.select('.nSideSlider').node().noUiSlider;
        nSideSlider.on('update', () => {
            nSideSliderLabel.html('Genes up/downstream: '
                + Math.round(nSideSlider.get()))
        })

        let showNameSelect = this.container
            .append('div');
        addLabel(showNameSelect,
            'Show on gene')
            //.style('text-align', 'center');
        showNameSelect = addCustomSelect(showNameSelect,
                'showName',
                'showName');
        showNameSelect.setChoices(
        [{ value: '', label: 'Gene text', selected: true, disabled: true },
            ...this.dataSimpleFields.map(f => {
                return { value : f, label : capitalize(f) }
            })
        ])
        let notationSelect = this.container
            .append('div')
        addLabel(notationSelect,
            'Color genes by')
            //.style('text-align', 'center');
        notationSelect = addCustomSelect(notationSelect,
                'notation',
                'notation')
        notationSelect.setChoices(
        [{ value: '', label: 'Color', selected: true, disabled: true },
            ...this.dataKeys.map(k => {
                return { value : k, label : capitalize(k) }
            })
        ])

        let levelSelect = this.container
            .append('div');
        addLabel(levelSelect,
            'Anotation level')
            //.style('text-align', 'center');
        this.levelSelect = addCustomSelect(levelSelect,
                'notationLevel',
                'notationLevel')
        this.levelSelect.setChoices([
            { value: '', label: 'Select level', selected: true, disabled: true }
        ])
        this.updateLevels('');

        let shuffleColors = this.container
            .append('div');
        shuffleColors
            .append('button')
            .attr('class', 'shuffleColors btn btn-secondary btn-sm')
            .style('margin-top', '33px')
            .html('Shuffle colors');

        let downloadPng = this.container
            .append('div');
        downloadPng
            .append('button')
            .attr('class', 'downloadPng btn btn-secondary btn-sm')
            .style('margin-top', '33px')
            .html('Download graph');
    }

    updateLevels(notation) {
        let levels = this.dataComplexFields[notation] || [];
        this.levelSelect.clearChoices();
        this.levelSelect.setChoices(levels.map(l => {
            return { value: l, label: capitalize(l) }
        }))
        let levelSelect = this.container.select('select.notationLevel');
        if (nonEmptyArray(levels)) levelSelect.attr('disabled', null);
        else levelSelect.attr('disabled', '');
    }
}
