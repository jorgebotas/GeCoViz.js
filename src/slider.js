var createSlider = function(container,
    className,
    options = {
        start : 0,
        step : 1,
        min : 0,
        max : 10
    }) {
    let slider = container.append('div')
        .attr('class', 'form-range ' + className)
    noUiSlider.create(slider.node(),
        {
            start: options.start,
            connect: [true, false],
            step: options.step,
            range: {
                min: options.min,
                max: options.max
        }});
    return slider
}
