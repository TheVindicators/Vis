from flask import render_template
from . import rest

@rest.route('/debug')
def rest_debug():
    return "Test!"
