
const { CLIENT_ID, CLIENT_SECRET, NAMESPACE } = require('../config');
const { ApiClient } = require('./apis');
const { get_label_vales } = require('../prom/index');
const linq = require('linq');

const client = new ApiClient(NAMESPACE, CLIENT_ID, CLIENT_SECRET);
const count_threshold = 50;

/**
 * 
 * @returns {Promise<Array<import('../data').IEntityInfo>>}
 */
async function get_all_tanants() {
    const order_by = [
        {
            field: "_id",
            direction: "asc"
        }
    ];

    let result = [];
    let resp = await client.queryRecords('tenant', ['_id', 'tenant_id', "_name"], null, order_by, true, '');
    while (resp && resp.code === "0" && resp.data.items && resp.data.items.length > 0) {
        for (const item of resp.data.items) {
            result.push({
                id: item.tenant_id,
                name: item._name && item._name.zh_cn ? item._name.zh_cn : item.tenant_id
            })
        }

        if (resp.data.next_page_token) {
            resp = await client.queryRecords('tenant', ['_id', 'tenant_id', "_name"], null, order_by, true, resp.data.next_page_token);
        }
        else {
            break;
        }
    }

    return result;
}

/**
 * 只会返回查询有结果的数据
 * @param {Array<string>} tenant_ids 
 * @returns {Promise<Array<import('../data').IEntityInfo>>}
 */
async function get_tanant_info_by_ids(tenant_ids) {
    let result = [];

    if (tenant_ids && tenant_ids.length >= count_threshold) {
        const all_tenants = await get_all_tanants();
        if (all_tenants) {
            for (const id of tenant_ids) {
                const tenant = linq.from(all_tenants).where(x => x.id === id).firstOrDefault();
                if (tenant) {
                    result.push(tenant);
                }
            }

            return result;
        }
    }

    const order_by = [
        {
            field: "_id",
            direction: "asc"
        }
    ];
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
        else {
            break;
        }
    }

    return result;
}

/**
 * 
 * @returns {Promise<Array<import('../data').IEntityInfo>>}
 */
async function get_all_namespaces() {
    const order_by = [
        {
            field: "_id",
            direction: "asc"
        }
    ];

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
            resp = await client.queryRecords('solution', ['_id', 'name', "namespcae"], null, order_by, true, resp.data.next_page_token);
        }
        else {
            break;
        }
    }

    return result;
}

/**
 * 只会返回查询有结果的数据
 * @param {Array<string>} namespaces 
 * @returns {Promise<Array<import('../data').IEntityInfo>>}
 */
async function get_app_info_by_namespaces(namespaces) {
    let result = [];

    if (namespaces && namespaces.length >= count_threshold) {
        const all_apps = await get_all_namespaces();
        if (all_apps) {
            for (const id of namespaces) {
                const app = linq.from(all_apps).where(x => x.id === id).firstOrDefault();
                if (app) {
                    result.push(app);
                }
            }

            return result;
        }
    }

    const order_by = [
        {
            field: "_id",
            direction: "asc"
        }
    ];
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
        else {
            break;
        }
    }

    return result;
}

/**
 * 
 * @param {string} match_expression 
 * @returns {Promise<Array<string> | undefined>}
 */
async function get_tenant_ids_from_prom(match_expression) {
    return await get_label_vales('tenant_id', match_expression);
}

/**
 * 
 * @param {string} match_expression 
 * @returns {Promise<Array<string> | undefined>}
 */
async function get_namespaces_from_prom(match_expression) {
    return await get_label_vales('namespace', match_expression);
}

module.exports = {
    get_tenant_ids_from_prom,
    get_namespaces_from_prom,
    get_tanant_info_by_ids,
    get_app_info_by_namespaces
}