export interface IEntityInfo {
    id: string,
    name: string
}

export interface IOrderBy {
    field: string,
    direction: string
}

export interface IOApiBaseResponse<T> {
    code: string,
    msg: string,
    data: T
}

export interface IQueryTenantInfoResult {
    items: IQueryTenantInfo[]
}

export interface IQueryTenantInfo {
    _id: string,
    _name: {
        zh_cn: string
    },
    tenant_id: string
}