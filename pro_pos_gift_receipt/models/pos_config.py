from odoo import fields, models


class PosConfig(models.Model):
    _inherit = "pos.config"

    enable_gift_receipt_qty_only = fields.Boolean(
        string="Enable Gift Receipt (Qty Only)",
        default=False,
        help="Show a Gift Receipt button on the POS Receipt Screen that prints product names and quantities only.",
    )

    # Alias kept for compatibility with prior builds that referenced this name.
    enable_gift_receipt = fields.Boolean(
        related="enable_gift_receipt_qty_only",
        readonly=False,
        store=False,
    )