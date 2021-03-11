var cleanString = function(s) {
    let clean = String(s);
    let dirt = " \t.,;:_/\'@<>?()[]{}#%!*|".split("");
    dirt.forEach(d => {
        clean = clean.replaceAll(d, "");
    })
    return String(clean)
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

var capitalize = function(string) {
    return string.trim().replace(/^\w/, c => c.toUpperCase());
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

var addCheckButton = function(g,
    label,
    className='') {
    let container = g.append('label')
        .attr('class', 'form-selectgroup-item')
    let input = container.append('input')
        .attr('type', 'checkbox')
        .attr('class', 'form-selectgroup-input ' + className)
        .attr('checked', '')
    container.append('span')
        .attr('class', 'form-selectgroup-label')
        .html(label)
    return input
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

var nonEmptyArray = function(a) {
    return Array.isArray(a)
        && a.length > 0
}

var triggerEvent = function(el, type) {
    // IE9+ and other modern browsers
    if ('createEvent' in document) {
        var e = document.createEvent('HTMLEvents');
        e.initEvent(type, false, true);
        el.dispatchEvent(e);
    } else {
        // IE8
        var e = document.createEventObject();
        e.eventType = type;
        el.fireEvent('on' + e.eventType, e);
    }
}

var counter = function(arr, attr) {
    //let initial = new Map(map.map(d => [d.id, 0]));
    let fn = (counter, d) => {
        let a = d[attr]
        counter[a] = counter[a]
                    ? counter[a] + 1
                    : 1;
        return counter;
    };
    return arr.reduce(fn, {});
}
