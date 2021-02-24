const util = require('util');
const fs = require('fs');
const Handlebars = require('handlebars');
const exec = util.promisify(require('child_process').exec);
const open = require('open');
const config = require('./config.json');
const { parseStdout } = require('./src/parseK8sStdout');

const k8sResources = {};
const helpers = {};

/**
 * Obtains specific kind of resources and their status for specific cluster
 * @param {string} environmentName Name of current environment
 * @param {string} resourceType Type of k8s resource to get
 * @param {string?} namespace Optional namespace to be used
 */
async function getResource(environmentName, resourceType, namespace) {
    const namespaceCmd = namespace ? ` -n ${namespace}` : '';
    const output = await exec(`kubectl get ${resourceType} ${namespaceCmd}`);

    const resources = parseStdout(output);
    k8sResources[environmentName] = k8sResources[environmentName] || {};
    k8sResources[environmentName][resourceType] = resources;

    // If Pod or HPA, do extra tasks
    if (helpers[resourceType]) {
        helpers[resourceType].applyHelperFunctions(k8sResources[environmentName][resourceType], config);
    }
}

/**
 * Obtains k8s all resources status for specific cluster
 * @param {Object | string} environment Environment where to obtain resources from
 */
async function getK8sResources(environment) {
    let namespace;
    let environmentName = environment;
    let context = environment;
    if (typeof environment !== 'string') {
        environmentName = environment.context;
        namespace = environment.namespace;
        context = `${environment.context} -n ${environment.namespace}`;
    }

    await exec(`kubectl config use-context ${context}`);

    for (const resource of config.resources) {
        // eslint-disable-next-line no-await-in-loop
        await getResource(environmentName, resource, namespace);
    }

    if (helpers.cluster) {
        helpers.cluster.applyHelperFunctions(k8sResources[environmentName], config);
    }
}

/**
 * Registers helpers needed for extend logic
 */
function registerHelpers() {
    // TODO - Improve helper injection
    /* eslint-disable global-require */
    helpers.hpa = require('./src/hpaHelper');
    helpers.cluster = require('./src/clusterHelper');
}

/**
 * Obtains k8s current status for all environments and creates HTML report
 */
async function getK8sInfo() {
    try {
        // Register helpers
        registerHelpers();

        // Get resources
        for (const environment of config.environments) {
            // eslint-disable-next-line no-await-in-loop
            await getK8sResources(environment);
        }

        // Create template
        Handlebars.registerHelper('substract', (lvalue, rvalue) => parseInt(lvalue) - parseInt(rvalue));
        const templateHtml = fs.readFileSync('./template/index.html', 'utf8');
        const template = Handlebars.compile(templateHtml);
        fs.writeFileSync(config.reportName, template(k8sResources));
        await open(config.reportName);
    } catch (e) {
        console.error(e);
    }
}

// TODO - Improve, refresh every X minutes?
getK8sInfo();
