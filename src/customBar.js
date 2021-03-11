var customBar = function(selector, data) {

    let dataKeys = data.reduce((maxKeys, d) => maxKeys.length
                                            <  Object.keys(d).length
                                                ? Object.keys(d)
                                                : maxKeys, []);
    // Extract complex and simple data fields
    let dataComplexFields = {}
    data.forEach(d => {
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
    let dataSimpleFields = dataKeys
        .filter(d => !Object.keys(dataComplexFields).includes(d));
    console.log(dataComplexFields)
    let vis = d3.select(selector);
    let container = vis.append('div')
            .attr('class', 'customBar col-md-10 mx-auto my-0 py-0');

    //let treeToggler = container.append('div');
    //addLabel(treeToggler, 'Toggle phylogeny')
        //.style('opacity', 0);
    //addCheckbox(treeToggler,
        //'Tree',
        //'toggleTree',
        //true);
    let checkButtonContainer = container
        .append('div')
    addLabel(checkButtonContainer, "Check buttons")
        .style('opacity', 0)
    checkButtonContainer = checkButtonContainer
        .append('div')
        .attr('class', 'd-flex');
    let checkButtons = [
        { label : 'Tree', class : 'toggleTree' },
        { label : 'Legend', class : 'toggleLegend' },
    ]
    checkButtons.forEach(cbutton => {
        addCheckButton(checkButtonContainer, cbutton.label, cbutton.class)
    })

    let nSideSlider = container
        .append('div');
    let nSideSliderLabel = addLabel(nSideSlider,
        'Genes up/downstream')
    nSideSlider = nSideSlider
        .append('div')
        .style('width', '200px')
        .style('margin-top', '1rem');
    createSlider(nSideSlider,
        'nSideSlider',
        options = {
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

    let showNameSelect = container
        .append('div');
    addLabel(showNameSelect,
        'Show on gene')
        .style('text-align', 'center');
    showNameSelect = addCustomSelect(showNameSelect,
            170,
            'showName',
            'showName');
    showNameSelect
        .append('option')
        .attr('selected', '')
        .attr('value', '')
        .html('Gene text');
    let showNameOption = showNameSelect
        .selectAll('option.showNameOption')
        .data(dataSimpleFields)
    let showNameOptionEnter = showNameOption
        .enter()
        .append('option')
        .attr('class', 'showNameOption')
    showNameOptionEnter
        .merge(showNameOption)
        .attr('value', d => d)
        .html(capitalize)

    let notationSelect = container
        .append('div')
    addLabel(notationSelect,
        'Color genes by')
        .style('text-align', 'center');
    notationSelect = addCustomSelect(notationSelect,
            170,
            'notation',
            'notation')
    notationSelect
        .append('option')
        .attr('value', '')
        .attr('selected', '')
        .html('Color')
     let notationOption = notationSelect
        .selectAll('option.notationOption')
        .data(dataKeys)
    let notationOptionEnter = notationOption
        .enter()
        .append('option')
        .attr('class', 'notationOption')
    notationOption
        .merge(notationOptionEnter)
        .attr('value', d => d)
        .html(capitalize)


    let levelSelect = container
        .append('div');
    addLabel(levelSelect,
        'eggNOG taxonomic level')
        .style('text-align', 'center');
    levelSelect = addCustomSelect(levelSelect,
            170,
            'notationLevel',
            'notationLevel')
    levelSelect
        .append('option')
        .attr('value', 2)
        .html('2: Bacteria')
    let eggnog = dataComplexFields.eggnog || dataComplexFields.eggNOG;
    try {
    let levelOption = levelSelect
        .selectAll('option.levelOption')
        .data(eggnog, d => d)
    let levelOptionEnter = levelOption
        .enter()
        .append('option')
        .attr('class', 'levelOption')
    levelOption
        .merge(levelOptionEnter)
        .attr('value', d => d)
        .html(capitalize)

    } catch {}

    let shuffleColors = container
        .append('div');
    addLabel(shuffleColors,
        'Shuffle colors')
        .style('opacity', 0);
    shuffleColors
        .append('button')
        .attr('class', 'shuffleColors btn btn-secondary btn-sm')
        .html('Shuffle colors');

    let downloadPng = container
        .append('div');
    addLabel(downloadPng,
        'Download graph as PNG')
        .style('opacity', 0);
    downloadPng
        .append('button')
        .attr('class', 'downloadPng btn btn-secondary btn-sm')
        .html('Download graph');

    selectBox(selector);
}
