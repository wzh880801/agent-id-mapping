
const { CLIENT_ID, CLIENT_SECRET, NAMESPACE } = require('../config');
const { ApiClient } = require('./apis');
const { get_label_vales } = require('../prom/index');

const client = new ApiClient(NAMESPACE, CLIENT_ID, CLIENT_SECRET);

module.exports = {

    /**
     * 
     * @returns {Promise<Array<import('../data').IEntityInfo>>}
     */
    get_all_tanants: async function () {
        const order_by = {
            field: "_id",
            direction: "asc"
        };

        let result = [];
        let resp = await client.queryRecords('tenant', ['_id', 'tenant_id', "_name"], null, order_by, true, '');
        while (resp && resp.code === "0" && resp.data.items && resp.data.items.length > 0) {
            for (const item of resp.data.items) {
                result.push({
                    id: item.tenant_id,
                    name: item._name.zh_cn
                })
            }

            if (resp.data.next_page_token) {
                resp = await client.queryRecords('tenant', ['_id', 'tenant_id', "_name"], order_by, true, resp.data.next_page_token);
            }
        }

        return result;
    },

    /**
     * 只会返回查询有结果的数据
     * @param {Array<string>} tenant_ids 
     * @returns {Promise<Array<import('../data').IEntityInfo>>}
     */
    get_tanant_info_by_ids: async function (tenant_ids) {
        let result = [];

        if (tenant_ids && tenant_ids.length >= 50) {
            const all_tenants = await this.get_all_tanants();
            if (all_tenants) {
                for (const id of tenant_ids) {
                    if (all_tenants[id]) {
                        result.push({
                            id,
                            name: all_tenants[id]
                        })
                    }
                }

                return result;
            }
        }

        const order_by = {
            field: "_id",
            direction: "asc"
        };
        const filter = {
            conditions: [
                {
                    left: {
                        type: "metadataVariable",
                        settings: JSON.stringify({
                            fieldPath: [{
                                fieldApiName: "tenant_id",
                                objectApiName: "tenant"
                            }]
                        })
                    },
                    right: {
                        type: "constant",
                        settings: JSON.stringify({
                            data: tenant_ids
                        })
                    },
                    operator: "isAnyOf"
                }
            ]
        }
        
        let resp = await client.queryRecords('tenant', ['_id', 'tenant_id', "_name"], filter, order_by, true, '');
        while (resp && resp.code === "0" && resp.data.items && resp.data.items.length > 0) {
            for (const item of resp.data.items) {
                result.push({
                    id: item.tenant_id,
                    name: item._name.zh_cn
                })
            }

            if (resp.data.next_page_token) {
                resp = await client.queryRecords('tenant', ['_id', 'tenant_id', "_name"], filter, order_by, true, resp.data.next_page_token);
            }
        }

        return result;
    },

    /**
     * 
     * @returns {Promise<Array<import('../data').IEntityInfo>>}
     */
    get_all_namespaces: async function () {
        const order_by = {
            field: "_id",
            direction: "asc"
        };

        let result = [];
        let resp = await client.queryRecords('solution', ['_id', 'name', "namespcae"], null, order_by, true, '');
        while (resp && resp.code === "0" && resp.data.items && resp.data.items.length > 0) {
            for (const item of resp.data.items) {
                result.push({
                    id: item.namespcae,
                    name: item.name
                })
            }

            if (resp.data.next_page_token) {
                resp = await client.queryRecords('solution', ['_id', 'name', "namespcae"], order_by, true, resp.data.next_page_token);
            }
        }

        return result;
    },

    /**
     * 只会返回查询有结果的数据
     * @param {Array<string>} namespaces 
     * @returns {Promise<Array<import('../data').IEntityInfo>>}
     */
    get_app_info_by_namespaces: async function (namespaces) {
        let result = [];

        if (namespaces && namespaces.length >= 50) {
            const all_apps = await this.get_all_namespaces();
            if (all_apps) {
                for (const id of namespaces) {
                    if (all_apps[id]) {
                        result.push({
                            id,
                            name: all_apps[id]
                        })
                    }
                }

                return result;
            }
        }

        const order_by = {
            field: "_id",
            direction: "asc"
        };
        const filter = {
            conditions: [
                {
                    left: {
                        type: "metadataVariable",
                        settings: JSON.stringify({
                            fieldPath: [{
                                fieldApiName: "namespcae",
                                objectApiName: "solution"
                            }]
                        })
                    },
                    right: {
                        type: "constant",
                        settings: JSON.stringify({
                            data: namespaces
                        })
                    },
                    operator: "isAnyOf"
                }
            ]
        }

        let resp = await client.queryRecords('solution', ['_id', 'name', "namespcae"], filter, order_by, true, '');
        while (resp && resp.code === "0" && resp.data.items && resp.data.items.length > 0) {
            for (const item of resp.data.items) {
                result.push({
                    id: item.namespcae,
                    name: item.name
                })
            }

            if (resp.data.next_page_token) {
                resp = await client.queryRecords('solution', ['_id', 'name', "namespcae"], filter, order_by, true, resp.data.next_page_token);
            }
        }

        return result;
    },

    /**
     * 
     * @param {string} match_expression 
     * @returns {Promise<Array<string> | undefined>}
     */
    get_tenant_ids_from_prom: async function (match_expression) {
        return await get_label_vales('tenant_id', match_expression);
    },

    /**
     * 
     * @param {string} match_expression 
     * @returns {Promise<Array<string> | undefined>}
     */
    get_namespaces_from_prom: async function (match_expression) {
        return await get_label_vales('namespace', match_expression);
    }
}