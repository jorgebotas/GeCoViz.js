var cleanString = function(s) {
    let clean = String(s);
    let dirt = ".,;:_/\'@<>?()[]{}#%!*|".split("");
    dirt.forEach(d => {
        clean = clean.replaceAll(d, "");
    })
    return clean;
}

var shuffle = function(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;

}

var addCheckbox = function(g,
                    label,
                    className,
                    switchToggle = false) {
    let containerClass = "form-check"
    containerClass += switchToggle ? " form-switch ml-4 py-1" : " m-1 ml-2";
    let container = g.append("label")
                     .attr("class", containerClass);
    container.append("input")
             .attr("class",
                 "mt-0 form-check-input rounded-pill "
                 + className)
             .attr("type", "checkbox")
             .attr("checked", "")
             .attr("style", "margin-top:0 !important;");
    container.append("span")
             .attr("class", "form-check-label")
             .html(label);
    return container;
}

var addCustomSelect = function(g,
            width,
            className,
            name) {
    let cs = g.append('div')
              .attr('class', 'custom-selectBox')
              .style('width', width + 'px');
    cs = cs.append('select')
      .attr('class', className + ' custom-select')
      .attr('name', name);
    return cs
}

var addLabel = function(g,
    html) {
    let label = g.append('label')
        .attr('class', 'form-label')
        .style('font-size', '1em')
        .style('font-weight', 'bold')
        .html(html);
    return label
}
