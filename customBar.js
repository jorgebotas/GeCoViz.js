var customBar = function(selector) {
    let vis = d3.select(selector);
    let container = vis.append('div')
            .attr('class', 'customBar col-md-10 mx-auto');

    addCheckbox(container.append('div'),
        'Tree',
        'tree',
        true);

    let nSideSlider = container
        .append('div');
    let nSideSliderLabel = addLabel(nSideSlider,
        'Genes up/downstream')
    nSideSlider = nSideSlider
        .append('div')
        .style('width', '200px');
    createSlider(nSideSlider,
        'nSideSlider',
        options = {
            start : 2,
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
            150,
            'showName',
            'showName')
    showNameSelect
        .append('option')
        .attr('selected', '')
        .attr('value', 'showName')
        .html('Gene name')
    showNameSelect
        .append('option')
        .attr('value', 'showName')
        .html('Gene name')
    showNameSelect
        .append('option')
        .attr('value', 'gene')
        .html('Gene id')
    showNameSelect
        .append('option')
        .attr('value', 'taxonomy')
        .html('Taxonomy')

    let notationSelect = container
        .append('div');
    addLabel(notationSelect,
        'Color genes by')
        .style('text-align', 'center');
    notationSelect = addCustomSelect(notationSelect,
            150,
            'notation',
            'notation')
    notationSelect
        .append('option')
        .attr('value', 'kegg')
        .html('KEGG')
    notationSelect
        .append('option')
        .attr('selected', '')
        .attr('value', 'kegg')
        .html('KEGG')
    notationSelect
        .append('option')
        .attr('value', 'eggnog')
        .html('eggNOG')
    notationSelect
        .append('option')
        .attr('value', 'showName')
        .html('Gene name')
    notationSelect
        .append('option')
        .attr('value', 'taxonomy')
        .html('Taxonomy')

    let levelSelect = container
        .append('div');
    addLabel(levelSelect,
        'eggNOG taxonomic level')
        .style('text-align', 'center');
    levelSelect = addCustomSelect(levelSelect,
            150,
            'notationLevel',
            'notationLevel')
    levelSelect
        .append('option')
        .attr('value', 2)
        .html('2: Bacteria')

    selectBox(selector);
}
