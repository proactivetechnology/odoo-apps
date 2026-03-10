from odoo import models


class PosSession(models.Model):
    _inherit = "pos.session"

    def _loader_params_pos_config(self):
        params = super()._loader_params_pos_config()
        search_params = params.setdefault("search_params", {})
        fields_list = search_params.setdefault("fields", [])
        for field_name in ("enable_gift_receipt_qty_only", "enable_gift_receipt"):
            if field_name not in fields_list:
                fields_list.append(field_name)
        return params