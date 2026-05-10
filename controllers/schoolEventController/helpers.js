// strip time so comparisons match what the old controller did with setHours
function startOfLocalDay(input) {
    const d = new Date(input);
    d.setHours(0, 0, 0, 0);
    return d;
}

// end of that same local day — keeps range endpoints identical to before
function endOfLocalDay(input) {
    const d = new Date(input);
    d.setHours(23, 59, 59, 999);
    return d;
}

module.exports = {
    startOfLocalDay,
    endOfLocalDay,
};
