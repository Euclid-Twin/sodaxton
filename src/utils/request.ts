import { request } from "umi";
export enum HttpRequestType {
  GET,
  POST,
}
export const API_HOST = "https://apiv2-test.platwin.io/api/v1";
// process.env.NODE_ENV === 'development' ? 'https://apiv2-test.platwin.io/api/v1' : 'https://apiv2.platwin.io/api/v1';
export const BACKEND_HOST = API_HOST;

export const SUCCESS_CODE = 0;

export async function httpRequest(req: any) {
  const response: any = {};
  const { url, params, type } = req;

  try {
    let res: any;
    if (type && type === HttpRequestType.POST) {
      res = await request(url, {
        method: "POST",
        data: params,
      });
    } else {
      res = await request(url, {
        method: "GET",
        params,
      });
    }
    return res;
  } catch (e) {
    console.error(e);
    response.error = (e as any).message || e;
  }
  return response;
}
