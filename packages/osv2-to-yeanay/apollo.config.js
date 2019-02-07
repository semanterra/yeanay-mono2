var configModule = require('./src/config')

var config = configModule.getConfig()

module.exports = {
    service: {
        name: 'osv2',
        endpoint: {
            url: "https://openstates.org/graphql",
            // optional headers
            headers: {
                "X-API-KEY": config.osApiKey,
            },
            // optional disable SSL validation check
            skipSSLValidation: true,
        },
    },
};
