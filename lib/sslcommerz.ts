// @ts-ignore - sslcommerz-lts does not have types
import SSLCommerzPayment from "sslcommerz-lts"

const store_id = process.env.SSLCOMMERZ_STORE_ID
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD
const is_live = process.env.NODE_ENV === "production"

export const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
