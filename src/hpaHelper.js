/**
 * Sets HPA status based on number of current replicas and its min/max
 * @param {Array} hpas Array of HPA resources
 */
/* eslint-disable no-param-reassign */
function setHPAStatus(hpas) {
    hpas.map(hpa => {
        const replicas = parseInt(hpa.replicas);
        const minpods = parseInt(hpa.minpods);
        const maxpods = parseInt(hpa.maxpods);

        let scalingStatus = 0;
        if (maxpods !== minpods) {
            scalingStatus = (replicas - minpods) / (maxpods - minpods);
        }

        if (replicas === 0) {
            hpa.status = 'critical';
        } else if (scalingStatus < 0.25) {
            hpa.status = 'healthy';
        } else if (scalingStatus > 0.75) {
            hpa.status = 'critical';
        } else {
            hpa.status = 'warning';
        }

        hpa.name = hpa.name.replace('hero-', '').replace('-autoscaler', '');
        return hpa;
    });
}

/**
 * Entry point to helper
 * @param {Array} hpas Array of HPA resources
 */
exports.applyHelperFunctions = function(hpas) {
    setHPAStatus(hpas);
};
