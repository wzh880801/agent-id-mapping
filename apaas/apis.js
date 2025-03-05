const { auth } = require('./auth');
const { axios } = require('../axiosBase');

var ApiClient = /** @class */ (function () {

    /**
     * 
     * @param {string} namespace 
     * @param {string} app_id 
     * @param {string} app_secret 
     */
    function ApiClient(namespace, app_id, app_secret) {
        if (!namespace || !app_id || !app_secret) {
            throw new Error(`invaliad api client credential. namespace=${namespace} app_id=${app_id}`);
        }

        this.namespace = namespace;
        this.app_id = app_id;
        this.app_secret = app_secret;
    }

    /**
     * 
     * @param {string} object_api_name 
     * @param {number} record_id 
     * @param {Array<string>} select_fields 
     * @returns {Promise<import('../data').IOApiBaseResponse>}
     */
    ApiClient.prototype.getRecord = async function (object_api_name, record_id, select_fields) {

        const resp = await axios({
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://ae-openapi.feishu.cn/v1/data/namespaces/${this.namespace}/objects/${object_api_name}/records/${record_id}`,
            headers: {
                'Authorization': await auth(this.app_id, this.app_secret),
                'Content-Type': 'application/json'
            },
            data: {
                select: select_fields
            }
        });

        return resp.data;
    };

    /**
     * 
     * @param {string} object_api_name 
     * @param {Array<string>} select_fields 
     * @param {*} filter
     * @param {Array<import('../data').IOrderBy>} order_by
     * @param {boolean} use_page_token
     * @param {string} page_token
     * @returns {Promise<import('../data').IOApiBaseResponse>}
     */
    ApiClient.prototype.queryRecords = async function (object_api_name, select_fields, filter, order_by, use_page_token, page_token) {

        let body = {

        };

        if (select_fields) {
            body['select'] = select_fields;
        }
        else {
            body['select'] = ['_id'];
        }

        if (filter) {
            body['filter'] = filter;
        }

        if (order_by) {
            body['order_by'] = order_by;
        }

        if (typeof use_page_token === typeof true && use_page_token) {
            body['use_page_token'] = true;
            body['page_token'] = page_token ? page_token : '';
        }

        const resp = await axios({
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://ae-openapi.feishu.cn/v1/data/namespaces/${this.namespace}/objects/${object_api_name}/records_query`,
            headers: {
                'Authorization': await auth(this.app_id, this.app_secret),
                'Content-Type': 'application/json'
            },
            data: body
        });

        return resp.data;
    };

    return ApiClient;
}());

exports.ApiClient = ApiClient;