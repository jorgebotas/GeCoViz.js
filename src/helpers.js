import Choices from 'choices.js';

var cleanString = function(s) {
    let clean = String(s);
    let dirt = " \t.,;:_/\\'@<>?()[]{}#%!*|".split("");
    dirt.forEach(d => {
        clean = clean.replaceAll(d, "");
    })
    return String(clean)
}

var shuffle = function(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;

}

var capitalize = function(string) {
    string = String(string);
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
    className='',
    checked=true) {
    let container = g.append('label')
        .attr('class', 'form-selectgroup-item mx-1')
    let input = container.append('input')
        .attr('type', 'checkbox')
        .attr('class', 'form-selectgroup-input ' + className);
    if (checked) input.attr('checked', '');
    container.append('span')
        .attr('class', 'form-selectgroup-label')
        .style('font-size', '12px')
        .html(label)
    return input
}

var addCustomSelect = function(g,
    className,
    name,
    placeholder="customSelect") {
    let select = g.append('select')
        .attr('class', 'form-select form-control ' + className)
        .attr('name', name)
    let choices = activateSelect(select.node(), placeholder)
    return choices
}

var activateSelect = function(select, placeholder) {
    let choices = new Choices(select, {
        classNames: {
            containerInner: select.className,
            input: 'form-control',
            inputCloned: 'form-control-sm',
            listDropdown: 'dropdown-menu',
            itemChoice: 'dropdown-item',
            activeState: 'show',
            selectedState: 'active',
            placeholder: 'choices__placeholder',
        },
        shouldSort: false,
        searchEnabled: false,
        placeholder: true,
        placeholderValue: placeholder,
    });
    return choices;
}

var addLabel = function(g,
    html, labelPadding=3) {
    let label = g.append('label')
        .attr('class', `form-label ml-${labelPadding}`)
        .style('font-size', '11px')
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
        let e = document.createEvent('HTMLEvents');
        e.initEvent(type, false, true);
        el.dispatchEvent(e);
    } else {
        // IE8
        let e = document.createEventObject();
        e.eventType = type;
        el.fireEvent('on' + e.eventType, e);
    }
}

var counter = function(arr, attr) {
    let fn = (counter, d) => {
        let a = d[attr]
        counter[a] = counter[a]
                    ? counter[a] + 1
                    : 1;
        return counter;
    };
    return arr.reduce(fn, {});
}

var applyCss = function(container, stylesheet) {
    // Apply CSS rules to elements contained in a (cloned) container
    let styles = [];
    Array.from(stylesheet.rules).forEach(r => {
        const style = r.cssText;
        if (style) 
            styles.push(style);
    })
    const style_element = document.createElement("style");
    style_element.innerHTML = styles.join("\n");
    container.appendChild(style_element);
}

function addCss(styles) {
    /* Create style element */
    const css = document.createElement('style');

    if (css.styleSheet)
        css.styleSheet.cssText = styles;
    else
        css.appendChild(document.createTextNode(styles));
     
    /* Append style to the head element */
    document.getElementsByTagName("head")[0].appendChild(css);
}

function hexToRgbA(hex, a){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+`,${a})`;
    }
    throw new Error('Bad Hex');
}

export {
    addCheckbox,
    addCheckButton,
    addCustomSelect,
    addLabel,
    addCss,
    applyCss,
    hexToRgbA,
    capitalize,
    cleanString,
    counter,
    nonEmptyArray,
    triggerEvent,
    shuffle,
}
