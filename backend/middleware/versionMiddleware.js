// Handle different API versions without breaking changes
export const handleVersion = (req, res, next) => {
    const apiVersion = req.headers['x-api-version'];
    
    if (!apiVersion || apiVersion === '1.0') {
        // Strip new fields for old clients
        res.originalJson = res.json;
        res.json = function(data) {
            const { verification, businessProfile, ...oldData } = data;
            res.originalJson(oldData);
        };
    }
    
    next();
}; 