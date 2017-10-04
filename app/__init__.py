from flask import Flask, render_template
from config import config
from werkzeug.contrib.fixers import ProxyFix

#Initialize object methods

def create_app(config_name):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    config[config_name].init_app

    #properly expose IP addresses if being reversed proxy
    app.wsgi_app = ProxyFix(app.wsgi_app)

    #Register main web interface as blueprint
    from main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    #Register REST server-client API
    from rest import rest as rest_blueprint
    app.register_blueprint(rest_blueprint, url_prefix='/rest')


    return app
