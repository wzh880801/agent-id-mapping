const { PROM_SERVER_URL } = require('../config');
const { axios } = require('../axiosBase');
const logger = require('../log/log_helper_v2').default().useFile(__filename).useSingleAppendMode();

/**
 * 
 * @param {string} label 
 * @returns {string}
 */
function get_api_url(label) {
    return `${PROM_SERVER_URL.trimEnd().replace(/\/+$/, "")}/api/v1/label/${label}/values`;
}

module.exports = {
    /**
     * 
     * @param {string} label 
     * @param {string} match_expression
     * @returns {Promise<Array<string> | undefined>}
     */
    get_label_vales: async function (label, match_expression) {
        try {
            let params = {};
            if (match_expression) {
                params['match[]'] = match_expression;
            }

            const resp = await axios({
                url: get_api_url(label),
                method: 'get',
                params: params
            })
            if (resp && resp.data && resp.data.status === 'success') {
                return resp.data.data;
            }
        }
        catch (err) {
            logger.error(`request label values error for label ${label}. ${err.message}`)
        }
    }
}