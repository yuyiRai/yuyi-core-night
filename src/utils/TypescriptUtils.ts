
export type ParamFirst<T> = T extends ((a: infer P, ...args: any[]) => any) ? P : never
export type ParamSecond<T> = T extends ((a: any, b: infer P, ...args: any[]) => any) ? P : never