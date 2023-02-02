'use strict';


export function assign(destination: any, ...sources: any[]): any {
    sources.forEach(source => Object.keys(source).forEach(key => destination[key] = source[key]));
    return destination;
}

export function removeEmtryAttributes(obj: any) {
    Object.keys(obj).forEach(key => {
        let val = obj[key];
        if (val === null || val === undefined) {
            delete obj[key];
        }
    });
}

export function deepCopy(obj: any): any {
    let dup: any;
    if (typeof (obj) == 'object') {
        if (obj == null) {
            dup = null;
        } else if (Array.isArray(obj)) {
            dup = new Array();
            obj.forEach(item => dup.push(deepCopy(item)));
        } else {
            dup = new Object();
            Object.keys(obj).forEach((key) => dup[key] = deepCopy(obj[key]));
        }
        return dup;
    } else {
        return obj;
    }
}

export function isEmptyObject(obj: Object) {
    return Object.keys(obj).length === 0;
}
