/**
 * Groups an array of pods by similar parent resource
 * @param {Array} pods Array of "pods" objects
 * @returns {Array} array with pods grouped by resource
 */
function groupByResource(pods) {
    const set = {};
    pods.forEach(pod => {
        if (set[pod.resource]) {
            if (pod.status !== 'Running') {
                set[pod.resource].status = pod.status;
            }
            const ready = pod.ready.split('/');
            set[pod.resource].ready.available += parseInt(ready[0]);
            set[pod.resource].ready.total += parseInt(ready[1]);
        } else {
            const ready = pod.ready.split('/');
            set[pod.resource || pod.name] = {
                name: pod.resource || pod.name,
                status: pod.status,
                ready: {
                    available: parseInt(ready[0]),
                    total: parseInt(ready[1]),
                },
            };
        }
    });
    return Object.values(set);
}

/**
 * Groups pods based on their parent deployment/cronjob/statefulset overridding resources parameter with
 * a new groupedPods property
 * @param {Object} resources k8s resources in one environment
 */
function setGroupedPods(resources) {
    const deployments = resources.deployment.map(deployment => deployment.name);
    const cronjobs = resources.cronjob.map(cronjob => cronjob.name);
    const statefulsets = resources.statefulset.map(statefulset => statefulset.name);
    const parentResources = deployments.concat(cronjobs).concat(statefulsets).sort((a, b) => b.length - a.length);
    resources.pod.map(pod => {
        parentResources.some(resource => {
            if (pod.name.includes(resource)) {
                pod.resource = resource;
                return true;
            }
            return false;
        });
        return undefined; // We are directly overwritting object
    });

    resources.groupedPods = groupByResource(resources.pod);
}

/**
 * Checks unexpected pods based on configuration
 * @param {Array} groupedPods Pods to be checked
 * @param {Array} expectedResources Array of expected resources to check against
 */
function checkIfPodExpected(groupedPods, expectedResources) {
    if (expectedResources && !!expectedResources.length) {
        groupedPods.map(groupedPod => {
            if (!expectedResources.some(expectedResource => groupedPod.name.includes(expectedResource))) {
                // TODO - Improve by "unexpected by cluster"
                groupedPod.unexpected = true;
            }
            return undefined; // We are directly overwritting object
        });
    }
}

/**
 * Entry point to helper
 * @param {Object} resources k8s resources in one environment
 * @param {Object} config Configuration to apply
 */
exports.applyHelperFunctions = function(resources, config) {
    setGroupedPods(resources);
    checkIfPodExpected(resources.groupedPods, config.expectedResources);
};
