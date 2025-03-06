
// 1. 根据 tenant_id 来查 tenanr_name，id - name mapping，暴露一个 list 接口，供看板上使用
// 2. namespace 同理
// 3. tenant < -> namespace 查看接口，支持看板上先选 tenant 或 先选 namespace 的场景
//     tenant -> 根据 tenant_id 查询下面有哪些 app
//     namespace -> 查看下面有哪些 tenant_id
const linq = require('linq');
const py = require('tiny-pinyin');
const logger = require('../log/log_helper_v2').default().useFile(__filename).useSingleAppendMode();
const { HTTP_ENDPOINT_PORT } = require('../config');

const {
    get_tenant_ids_from_prom,
    get_namespaces_from_prom,
    get_tanant_info_by_ids,
    get_app_info_by_namespaces
} = require('../apaas/index');

/* 引入express框架 */
const express = require('express');
const app = express();

/* 引入cors */
const cors = require('cors');
app.use(cors());

app.use(express.urlencoded({ extended: false }));

let data = {
    tenant_ids: {},
    apps: {}
};

/**
 * 
 * @param {string[]} tenant_ids 
 * @param {string} __trace_id 
 * @returns {Promise<import('../data').IEntityInfo[]>}
 */
async function get_tenant_info_and_update_cache(tenant_ids, __trace_id) {
    const _logger = logger.default().new();
    if (__trace_id) {
        _logger.useTraceId(__trace_id);
    }

    let result = [];
    const resp = await get_tanant_info_by_ids(tenant_ids);

    _logger.info(`查询到 ${resp ? resp.length : 0} 条记录`);

    if (resp) {
        for (const id of tenant_ids) {
            const tenant = linq.from(resp).firstOrDefault(x => x.id === id);
            if (tenant) {
                result.push(tenant);
                data.tenant_ids[id] = tenant.name;
            }
            else {
                result.push({
                    id,
                    name: id
                })
            }
        }
    }
    return result;
}

/**
 * 
 * @param {string[]} namespaces 
 * @param {string} __trace_id 
 * @returns {Promise<import('../data').IEntityInfo[]>}
 */
async function get_app_info_and_update_cache(namespaces, __trace_id) {
    const _logger = logger.default().new();
    if (__trace_id) {
        _logger.useTraceId(__trace_id);
    }

    let result = [];
    const resp = await get_app_info_by_namespaces(namespaces);

    _logger.info(`查询到 ${resp ? resp.length : 0} 条记录`);

    if (resp) {
        for (const id of namespaces) {
            const app = linq.from(resp).firstOrDefault(x => x.id === id);
            if (app) {
                result.push(app);
                data.apps[id] = app.name;
            }
            else {
                result.push({
                    id,
                    name: id
                })
            }
        }
    }
    return result;
}

app.all('*', async (req, res, next) => {
    const _logger = logger.default().new();
    req.headers['__trace_id'] = _logger.getTraceid();

    _logger.info(`${req.method}\t${req.path}`);
    next();
})

app.get('/tenant/list', async (req, res) => {
    // 1. 实时请求一次 prom 接口，拿到 tenant_id 集合
    // 2. 从缓存拿 id-name mapping
    //    - 如果拿不到 id-name mapping，根据传入参数决定是串行查询还是 settimeout 去查（本次不返回 name)

    const _logger = logger.default().new();
    if (req.headers['__trace_id']) {
        _logger.useTraceId(req.headers['__trace_id']);
    }

    const is_serial_query = req.query['serial_query'] === 'true' || req.query['serial_query'] === '1';
    const filter = req.query['filter'];
    if (filter) {
        _logger.info(`filter=${filter}`);
    }
    const is_sort = req.query['sort'] === 'true' || req.query['sort'] === '1';
    const is_name_with_id = req.query['name_with_id'] === 'true' || req.query['name_with_id'] === '1';

    const all_tenant_ids = await get_tenant_ids_from_prom(filter);
    if (!all_tenant_ids) {
        res.json([]);
        return;
    }

    let result = [];
    let not_ids = [];
    for (const t of all_tenant_ids) {
        if (!data.tenant_ids[t]) {
            not_ids.push(t);
        }
        else {
            result.push({
                id: t,
                name: data.tenant_ids[t]
            })
        }
    }

    if (not_ids.length > 0) {
        _logger.info(`${not_ids.length} 条记录未命中缓存，${is_serial_query ? '同步' : '异步'}查询。`);

        if (is_serial_query) {
            // 阻塞查询，实时查询 api 获取 id-mapping，然后再返回
            const resp = await get_tenant_info_and_update_cache(not_ids, req.headers['__trace_id']);
            for (const t of resp) {
                result.push(t);
            }
        }
        else {
            for (const id of not_ids) {
                result.push({
                    id,
                    name: id
                })
            }

            // 异步去查询并更新缓存，本次就只返回 id-id 
            setTimeout(async () => {
                await get_tenant_info_and_update_cache(not_ids, req.headers['__trace_id']);
            }, 10);
        }
    }

    if (is_name_with_id) {
        result = linq.from(result)
            .select(x => {
                return {
                    id: x.id,
                    name: x.id !== x.name ? `${x.name}(${x.id})` : x.name
                }
            }).toArray();
    }

    if (is_sort) {
        // result = linq.from(result).orderBy(x => x.name).toArray();
        result = result.sort((a, b) => {
            // 比较排序
            return py.convertToPinyin(a.name).localeCompare(py.convertToPinyin(b.name));
        });
    }

    res.json(result);
})

app.get('/app/list', async (req, res) => {
    // 1. 实时请求一次 prom 接口，拿到 namespace 集合
    // 2. 从缓存拿 id-name mapping
    //    - 如果拿不到 id-name mapping，根据传入参数决定是串行查询还是 settimeout 去查（本次不返回 name)

    const _logger = logger.default().new();
    if (req.headers['__trace_id']) {
        _logger.useTraceId(req.headers['__trace_id']);
    }

    const is_serial_query = req.query['serial_query'] === 'true' || req.query['serial_query'] === '1';
    const filter = req.query['filter'];
    if (filter) {
        _logger.info(`filter=${filter}`);
    }

    const is_sort = req.query['sort'] === 'true' || req.query['sort'] === '1';
    const is_name_with_id = req.query['name_with_id'] === 'true' || req.query['name_with_id'] === '1';

    const all_namespaces = await get_namespaces_from_prom(filter);
    if (!all_namespaces) {
        res.json([]);
        return;
    }

    let result = [];
    let not_ids = [];
    for (const t of all_namespaces) {
        if (!data.apps[t]) {
            not_ids.push(t);
        }
        else {
            result.push({
                id: t,
                name: data.apps[t]
            })
        }
    }

    if (not_ids.length > 0) {
        _logger.info(`${not_ids.length} 条记录未命中缓存，${is_serial_query ? '同步' : '异步'}查询。`);

        if (is_serial_query) {
            // 阻塞查询，实时查询 api 获取 id-mapping，然后再返回
            const resp = await get_app_info_and_update_cache(not_ids, req.headers['__trace_id']);
            for (const t of resp) {
                result.push(t);
            }
        }
        else {
            for (const id of not_ids) {
                result.push({
                    id,
                    name: id
                })
            }

            // 异步去查询并更新缓存，本次就只返回 id-id 
            setTimeout(async () => {
                await get_app_info_and_update_cache(not_ids, req.headers['__trace_id']);
            }, 10);
        }
    }

    if(is_name_with_id) {
        result = linq.from(result)
            .select(x => {
                return {
                    id: x.id,
                    name: x.id !== x.name ? `${x.name}(${x.id})` : x.name
                }
            }).toArray();
    }

    if(is_sort) {
        // 使用 localeCompare 方法按照英文首字母和中文拼音首字母进行排序
        result = result.sort((a, b) => {
            // 比较排序
            return py.convertToPinyin(a.name).localeCompare(py.convertToPinyin(b.name));
        });
    }

    res.json(result);
})

/* 监听端口 */
app.listen(HTTP_ENDPOINT_PORT, () => {
    logger.info(`listening: ${HTTP_ENDPOINT_PORT}`);
})