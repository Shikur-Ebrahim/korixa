"use client";

import { useTrade } from "@/components/trade/TradeProvider";
import { formatUsd } from "@/lib/format";
import { appTheme } from "@/components/layout/app-theme";
import { TradeEmptyState } from "@/components/trade/TradeStates";

export function OpenOrders() {
  const { openOrders, cancelOrder } = useTrade();

  return (
    <div className={`${appTheme.card} p-0`}>
      <p className="border-b border-white/[0.06] px-4 py-3 text-sm font-semibold text-white">
        Open Orders
      </p>

      {!openOrders.length ? (
        <TradeEmptyState message="No open orders." />
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {openOrders.map((order) => (
            <div key={order.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-white">{order.pair}</p>
                  <p className="text-[10px] capitalize text-[#848e9c]">
                    {order.type} · {order.side}
                  </p>
                </div>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {order.status}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <p className="text-[#848e9c]">Price</p>
                  <p className="text-white">{formatUsd(order.price)}</p>
                </div>
                <div>
                  <p className="text-[#848e9c]">Amount</p>
                  <p className="text-white">{order.amount.toFixed(6)}</p>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => cancelOrder(order.id)}
                    className="text-xs font-medium text-red-400 hover:text-red-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
