/** Frontend-only recovery data. No backend change or production data write. */
export function fetchFridayMarketData(kind: "market" | "macro" | "liquidity" | "depegs" | "onchain"): Promise<Response> {
  if (kind === "depegs" || kind === "onchain") {
    return Promise.resolve(new Response(JSON.stringify({state:"UNAVAILABLE",reason:"No verified recovery snapshot; not zero"}),{status:503,headers:{"Content-Type":"application/json"}}));
  }
  return fetch(`${import.meta.env.BASE_URL}friday-data/${kind}.json`,{cache:"no-cache"});
}
