/** @odoo-module **/

import { Component } from "@odoo/owl";
import { patch } from "@web/core/utils/patch";
import { ReceiptScreen } from "@point_of_sale/app/screens/receipt_screen/receipt_screen";
import { TicketScreen } from "@point_of_sale/app/screens/ticket_screen/ticket_screen";

class GiftReceipt extends Component {
    static template = "pro_pos_gift_receipt.GiftReceipt";
    static props = ["data"];
}

function pad2(value) {
    return String(value).padStart(2, "0");
}

function formatDateTime(rawDate) {
    let dateObj = rawDate ? new Date(rawDate) : new Date();
    if (Number.isNaN(dateObj.getTime())) {
        dateObj = new Date();
    }
    return [
        dateObj.getFullYear(),
        pad2(dateObj.getMonth() + 1),
        pad2(dateObj.getDate()),
    ].join("-") + " " + [pad2(dateObj.getHours()), pad2(dateObj.getMinutes())].join(":");
}

function getLogoSrc(logoValue) {
    if (!logoValue) {
        return "";
    }
    if (String(logoValue).startsWith("data:image")) {
        return logoValue;
    }
    return `data:image/png;base64,${logoValue}`;
}

function formatQty(value) {
    if (value === null || value === undefined) {
        return "";
    }
    if (typeof value === "number") {
        const rounded = Math.round((value + Number.EPSILON) * 1000) / 1000;
        return Number.isInteger(rounded) ? String(Math.trunc(rounded)) : String(rounded);
    }
    return String(value);
}

function normalizeRawLine(line) {
    if (!line) {
        return null;
    }
    if (!Array.isArray(line)) {
        return line;
    }
    const objectItem = line.find((item) => item && typeof item === "object" && !Array.isArray(item));
    return objectItem || null;
}

function getLineFromOrderlineObject(line) {
    const product = line.get_product?.();
    const name =
        line.get_full_product_name?.() ||
        product?.display_name ||
        product?.name ||
        "";
    const qty =
        typeof line.get_quantity_str === "function"
            ? line.get_quantity_str()
            : formatQty(line.get_quantity?.());
    return {
        product_name: name,
        qty,
    };
}

function getLineFromRawLine(rawLine, pos) {
    let name =
        rawLine.full_product_name ||
        rawLine.product_full_name ||
        rawLine.product_name ||
        rawLine.display_name ||
        rawLine.name ||
        rawLine.product?.display_name ||
        rawLine.product?.name ||
        "";

    const productId = rawLine.product_id || rawLine.product;
    if (!name && Array.isArray(productId)) {
        name = productId[1] || "";
    }
    if (!name && typeof productId === "number") {
        const product = pos?.db?.get_product_by_id?.(productId);
        name = product?.display_name || product?.name || "";
    }

    const qty = formatQty(
        rawLine.qty ??
            rawLine.quantity ??
            rawLine.product_qty ??
            rawLine.qty_done ??
            rawLine.item_qty
    );

    return {
        product_name: name,
        qty,
    };
}

function getOrderlines(order) {
    if (!order) {
        return [];
    }
    if (typeof order.get_orderlines === "function") {
        return order.get_orderlines() || [];
    }
    if (Array.isArray(order.orderlines)) {
        return order.orderlines;
    }
    if (Array.isArray(order.lines)) {
        return order.lines;
    }
    if (Array.isArray(order.data?.lines)) {
        return order.data.lines;
    }
    if (Array.isArray(order.order?.lines)) {
        return order.order.lines;
    }
    return [];
}

function getGiftReceiptLines(order, pos) {
    const lines = [];
    for (const line of getOrderlines(order)) {
        let normalized;
        if (line && typeof line.get_product === "function") {
            normalized = getLineFromOrderlineObject(line);
        } else {
            const rawLine = normalizeRawLine(line);
            if (!rawLine || typeof rawLine !== "object") {
                continue;
            }
            normalized = getLineFromRawLine(rawLine, pos);
        }

        if (!normalized.product_name) {
            continue;
        }
        lines.push({
            product_name: normalized.product_name,
            qty: normalized.qty,
        });
    }
    return lines;
}

function getOrderName(order) {
    return (
        order?.get_name?.() ||
        order?.name ||
        order?.pos_reference ||
        order?.reference ||
        order?.uid ||
        ""
    );
}

function getOrderDate(order) {
    return (
        order?.date_order ||
        order?.validation_date ||
        order?.creation_date ||
        order?.create_date ||
        order?.date ||
        null
    );
}

function buildGiftReceiptData(order, pos) {
    return {
        logo_src: getLogoSrc(pos?.company?.logo),
        company_name: pos?.company?.name || "",
        shop_name: pos?.config?.name || "",
        order_name: getOrderName(order),
        order_date: formatDateTime(getOrderDate(order)),
        lines: getGiftReceiptLines(order, pos),
    };
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function browserGiftReceiptFallback(data) {
    const rows = data.lines
        .map(
            (line) =>
                `<tr><td class="c1">${escapeHtml(line.product_name)}</td><td class="c2">${escapeHtml(line.qty)}</td></tr>`
        )
        .join("");

    const logo = data.logo_src
        ? `<div class="logo-wrap"><img src="${escapeHtml(data.logo_src)}" class="logo" alt="logo" /></div>`
        : "";

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Gift Receipt</title>
<style>
body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
.receipt { width: 302px; margin: 0 auto; color: #111; font-size: 12px; line-height: 1.35; }
.logo-wrap { text-align: center; margin-bottom: 8px; }
.logo { max-width: 130px; max-height: 60px; object-fit: contain; }
.center { text-align: center; }
.company { font-size: 15px; font-weight: 700; letter-spacing: 0.3px; margin: 0; }
.shop { font-size: 12px; margin: 2px 0 10px; }
.title { font-size: 14px; font-weight: 700; margin: 6px 0; }
.meta { margin: 2px 0; }
.sep { border-top: 1px solid #bdbdbd; margin: 8px 0; }
table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
th, td { padding: 5px 0; }
th { font-weight: 700; border-bottom: 1px solid #bdbdbd; }
th:first-child, td:first-child { text-align: left; width: 82%; padding-right: 8px; word-break: break-word; }
th:last-child, td:last-child { text-align: right; width: 18%; white-space: nowrap; }
.note { text-align: center; margin: 4px 0; }
</style>
</head>
<body>
<div class="receipt">
${logo}
<div class="center company">${escapeHtml(data.company_name)}</div>
<div class="center shop">${escapeHtml(data.shop_name)}</div>
<div class="center title">Gift Receipt</div>
<div class="center meta">Order: ${escapeHtml(data.order_name)}</div>
<div class="center meta">Date: ${escapeHtml(data.order_date)}</div>
<div class="sep"></div>
<table>
<thead><tr><th>Product</th><th>Qty</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<div class="sep"></div>
<div class="note">Thank you for your purchase</div>
<div class="note">Items may be exchanged according to store policy</div>
<div class="sep"></div>
</div>
<script>window.print();window.close();</script>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
}

function isGiftReceiptEnabled(pos) {
    const config = pos?.config || {};
    return Boolean(config.enable_gift_receipt_qty_only || config.enable_gift_receipt);
}

function isPaidOrCompletedOrder(order) {
    if (!order) {
        return false;
    }

    if (typeof order.is_paid === "function") {
        return Boolean(order.is_paid());
    }
    if (typeof order.isPaid === "function") {
        return Boolean(order.isPaid());
    }

    const stateCandidates = [
        order.state,
        order.status,
        order.order_status,
        order.data?.state,
        order.order?.state,
    ];
    for (const state of stateCandidates) {
        if (!state) {
            continue;
        }
        const lowered = String(state).toLowerCase();
        return ["paid", "done", "invoiced", "completed"].includes(lowered);
    }

    return true;
}

function getSelectedTicketOrder(screen) {
    const direct = [
        screen.getSelectedOrder?.(),
        screen.selectedOrder,
        screen.state?.selectedOrder,
        screen.props?.selectedOrder,
    ];
    for (const candidate of direct) {
        if (candidate) {
            return candidate;
        }
    }

    const selectedRef =
        screen.selectedOrderUuid ||
        screen.state?.selectedOrderUuid ||
        screen.props?.selectedOrderUuid ||
        screen.selectedOrderId ||
        screen.state?.selectedOrderId;

    const pools = [
        screen.orders,
        screen.state?.orders,
        screen.props?.orders,
        screen.pos?.orders,
        screen.pos?.syncedOrders,
    ].filter(Boolean);

    for (const pool of pools) {
        const list = Array.isArray(pool)
            ? pool
            : Array.isArray(pool.models)
              ? pool.models
              : Array.isArray(pool.records)
                ? pool.records
                : [];
        if (!list.length) {
            continue;
        }

        if (!selectedRef) {
            return list[0];
        }

        const found = list.find((order) =>
            [order?.id, order?.uid, order?.uuid, order?.name, order?.pos_reference].includes(selectedRef)
        );
        if (found) {
            return found;
        }
    }

    return null;
}

async function printGiftReceipt(screen, order) {
    if (!order) {
        return;
    }

    const data = buildGiftReceiptData(order, screen.pos);
    const printer = screen.pos?.printer || screen.env?.services?.printer;

    if (printer?.print) {
        await printer.print(GiftReceipt, { data }, { webPrintFallback: true });
        return;
    }

    browserGiftReceiptFallback(data);
}

patch(ReceiptScreen.prototype, {
    get showGiftReceiptButton() {
        if (!isGiftReceiptEnabled(this.pos)) {
            return false;
        }
        const order = this.pos?.get_order?.();
        return Boolean(order && getGiftReceiptLines(order, this.pos).length);
    },

    async onClickGiftReceipt() {
        const order = this.pos?.get_order?.();
        await printGiftReceipt(this, order);
    },
});

patch(TicketScreen.prototype, {
    get showGiftReceiptTicketButton() {
        if (!isGiftReceiptEnabled(this.pos)) {
            return false;
        }
        const order = getSelectedTicketOrder(this);
        if (!order || !isPaidOrCompletedOrder(order)) {
            return false;
        }
        return Boolean(getGiftReceiptLines(order, this.pos).length);
    },

    async onClickGiftReceiptTicket() {
        const order = getSelectedTicketOrder(this);
        if (!order || !isPaidOrCompletedOrder(order)) {
            return;
        }
        await printGiftReceipt(this, order);
    },
});