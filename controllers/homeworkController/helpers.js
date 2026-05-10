// empty assignedTo would break queries expecting an array, old code used []
function normalizeAssignedTo(assignedTo) {
    return assignedTo || [];
}

function sameId(a, b) {
    return String(a) === String(b);
}

module.exports = {
    normalizeAssignedTo,
    sameId,
};
