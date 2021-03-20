var Sorter = {
    sort: function (arrayToSort, sortFunction) {
        if (arrayToSort.length <= 10)
            return this.insertionSort(arrayToSort, sortFunction);
        else return this.mergeSort(arrayToSort, sortFunction);
    },

    mergeSort: function (arr, sortFunction) {
        if (arr.length < 2)
            return arr;

        var middle = parseInt(arr.length / 2);
        var left = arr.slice(0, middle);
        var right = arr.slice(middle, arr.length);

        return this.merge(this.mergeSort(left, sortFunction), this.mergeSort(right, sortFunction), sortFunction);
    },

    merge: function (left, right, sortFunction) {
        var result = [];

        while (left.length && right.length) {
            if (sortFunction(left[0], right[0]) < 1) {
                result.push(left.shift());
            } else {
                result.push(right.shift());
            }
        }

        while (left.length)
            result.push(left.shift());

        while (right.length)
            result.push(right.shift());

        return result;
    },

    insertionSort: function (arrayToSort, sortFunction) {
        var arrLength = arrayToSort.length;
        var value;
        var i;
        var j;

        for (i = 0; i < arrLength; i++) {
            value = arrayToSort[i];
            for (j = i - 1; j > -1 && sortFunction(arrayToSort[j], value) == 1; j--)
            {
                arrayToSort[j + 1] = arrayToSort[j];
            }
            arrayToSort[j + 1] = value;
        }

        return arrayToSort;
    }
}

export default Sorter;,
