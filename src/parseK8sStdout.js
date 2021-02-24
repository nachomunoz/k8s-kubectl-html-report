const KUBECTL_SEPARATOR = /\s{2,}/g; // 2 or more spaces

function splitRow(row) {
    return row.replace(KUBECTL_SEPARATOR, '#').split('#');
}

/**
 * Parses a console stdout line
 * @param {string} line Console stdout line to be parsed
 * @param {Array} headers Parsed console headers
 * @returns {Object} parsed line as an object
 */
function parseLine(line, headers) {
    const parsedLine = {};
    const splitLine = splitRow(line);
    splitLine.forEach((columnValue, index) => {
        if (columnValue !== '<none>') {
            // Trimming as we divided by 2 spaces but we could have one still there
            parsedLine[headers[index].trim()] = columnValue.trim();
        }
    });
    return parsedLine;
}

/**
 * Parses console output to get an array of objects to be easily managed later
 * @param {Object} output Console output to parse stdout from
 * @returns {Array} parsed output as array of objects
 */
exports.parseStdout = function(output) {
    const lines = output.stdout.split('\n');
    const headerRow = lines.shift(); // 1st row
    const resourceRows = lines.filter(l => !!l.length); // Filter those without length

    const headers = splitRow(headerRow.toLowerCase());
    return resourceRows.map(line => parseLine(line, headers)); // Parse every line
};
