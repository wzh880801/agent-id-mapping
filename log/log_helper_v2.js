const { LogHelper } = require('./logHelper');
const { LOKI_API_KEY, LOKI_API_URL } = require('../config');

module.exports.default = function () {
    const logger = new LogHelper()
        .addSensitiveWords(['Authorization'])
        .setServiceName('agent-id-mapping')
        .setPath('/var/logs/agent-id-mapping');

    if (LOKI_API_URL) {
        return logger
            .setLoki(LOKI_API_URL, LOKI_API_KEY)
            .withReport();
    }
    return logger.noReport();
}