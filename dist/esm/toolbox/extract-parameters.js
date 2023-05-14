const extractParameters = (mockUrl, requestUrl) => {
    const routePaths = mockUrl.split('/').filter((v) => v !== '');
    const requestPaths = requestUrl.split('/').filter((v) => v !== '');
    const parameters = {};
    if (routePaths.length !== requestPaths.length) {
        return undefined;
    }
    let match = false;
    for (let n = 0, rlen = routePaths.length; n < rlen; n += 1) {
        const routePath = routePaths[n];
        const requestPath = requestPaths[n];
        if (routePath === requestPath) {
            match = n === rlen - 1;
            continue;
        }
        if (routePath.indexOf('{') === 0 && requestPath !== undefined) {
            const paramName = String(routePath).replace('{', '').replace('}', '');
            parameters[paramName] = requestPath;
            match = n === rlen - 1;
        }
    }
    if (match) {
        return parameters;
    }
};
export default extractParameters;
