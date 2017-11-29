from flask import Flask, render_template
from flask_assets import Environment, Bundle
from webassets.loaders import YAMLLoader
from config import config
import os

#Initialize object methods

def create_app(config_name):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    config[config_name].init_app


    #bundle all JS. if you wish to avoid this, comment this out and edit
    #main/views.py to send "editor-unpacked.html" instead. note that if you
    #use new JS files, you'll need to include them in assets.yml in the root dir
    assets = Environment()
    assets.init_app(app)
    bundles = YAMLLoader('assets.yml').load_bundles()
    [assets.register(name, bundle) for name, bundle in bundles.iteritems()]

    #create server-side save state directory if it doesn't exist
    if not os.path.exists(app.config["JSON_STORE_DATA"]):
        os.makedirs(app.config["JSON_STORE_DATA"])

    #create server-side file conversion directory if it doesn't exist
    if not os.path.exists(app.config["FILE_CONVERSION_WORK_DIR"]):
        os.makedirs(app.config["FILE_CONVERSION_WORK_DIR"])

    #properly expose IP addresses if being reversed proxy
    #app.wsgi_app = ProxyFix(app.wsgi_app)

    #Register main web interface as blueprint
    from main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    #Register REST server-client API
    from rest import rest as rest_blueprint
    app.register_blueprint(rest_blueprint, url_prefix='/rest')


    return app
