import { request } from "umi";
export enum HttpRequestType {
  GET,
  POST,
}
export const API_HOST = process.env.API_HOST;
// process.env.APP === "development"
//   ? "https://apiv2-test.platwin.io/api/v1"
//   : "https://apiv2.platwin.io/api/v1";

export const BACKEND_HOST = API_HOST;

export const SUCCESS_CODE = 0;

export async function httpRequest(req: {
  url: string;
  params?: any;
  type?: HttpRequestType;
  requestType?: any;
}) {
  const response: any = {};
  const { url, params, type, requestType } = req;

  try {
    let res: any;
    if (type && type === HttpRequestType.POST) {
      res = await request(url, {
        method: "POST",
        data: params,
        requestType,
        headers: { authorization: "TG Robot Platwin Soda" },
        errorHandler: () => {},
      });
    } else {
      res = await request(url, {
        method: "GET",
        params,
        requestType,
        errorHandler: () => {},
      });
    }
    return res;
  } catch (e) {
    console.error(e);
    response.error = (e as any).message || e;
  }
  return response;
}
