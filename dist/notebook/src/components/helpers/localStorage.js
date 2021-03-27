export function trySetLocalStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    }
    catch (e) {
        console.warn(`Could not set localStorage (key = ${key}).`);
    }
}
//# sourceMappingURL=localStorage.js.map