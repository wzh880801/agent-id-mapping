const { axios } = require('../axiosBase');
const logger = require('../log/log_helper_v2').default().useFile(__filename).useSingleAppendMode();

let tokens = {

}

/**
 * 
 * @param {string} app_id 
 * @param {string} app_secret 
 * @returns {Promise<string | undefined>}
 */
async function auth(app_id, app_secret) {

    const token = tokens[app_id];
    if (token && token.expireTime - 10 * 1000 >= new Date().getTime()) {
        return token.accessToken;
    }

    const resp = await axios({
        method: 'post',
        url: 'https://ae-openapi.feishu.cn/auth/v1/appToken',
        headers: {
            'Content-Type': 'application/json'
        },
        data: {
            clientId: app_id,
            clientSecret: app_secret
        }
    });

    if (resp.data && resp.data.data && resp.data.data.accessToken) {
        tokens[app_id] = resp.data.data;
        return resp.data.data.accessToken;
    }

    logger.error(resp.data);
}

module.exports = {
    auth
}
