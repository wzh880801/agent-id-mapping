const axios = require('axios');
const logger = require('./log/log_helper_v2').default().useFile(__filename).useSingleAppendMode();

axios.interceptors.response.use(response => {
    return response;
}, async (err) => {

    const _logger = logger.new().default();
    if (err && err.config && err.config.headers && err.config.headers['__trace_id']) {
        _logger.useTraceId(err.config.headers['__trace_id']);
    }

    const _info = {
        config: err.config
    }
    if (err.response) {
        _info['status'] = err.response.status;
        _info['response'] = typeof err.response.data === typeof {} ? JSON.stringify(err.response.data) : err.response.data;
    }

    _logger.append({ ext: 'AXIOS_ERROR' }).error(_info);

    return Promise.reject(err);
});

// default timeout is 10s
axios.defaults.timeout = 10000;

module.exports = {
    axios
}