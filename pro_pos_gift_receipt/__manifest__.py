{
    "name": "POS Gift Receipt (Qty Only)",
    "version": "18.0.1.1.0",
    "category": "Point of Sale",
    "summary": "Print a gift receipt without prices (quantity only) from POS",
    "license": "LGPL-3",
    "author": "ProActive Technology",
    "maintainer": "Muhamed Ayman",
    "depends": ["point_of_sale"],
    "data": [
        "views/pos_config_view.xml"
    ],
    "assets": {
        "point_of_sale._assets_pos": [
            "pro_pos_gift_receipt/static/src/js/gift_receipt.js",
            "pro_pos_gift_receipt/static/src/xml/gift_receipt_button.xml"
        ]
    },
    "price": 19.99,
    "currency": "USD",
    "installable": True,
    "application": False
}
