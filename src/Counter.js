var counter = function(arr, attr) {
    //let initial = new Map(map.map(d => [d.id, 0]));
    let fn = (counter, d) => {
        let a = d[attr]
        return counter[a] =
                  counter[a]
                    ? counter[a] + 1
                    : 1;
    };
    return arr.reduce(fn);
}
