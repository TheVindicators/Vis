import os, subprocess
basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY ='CHANGE THIS' #optional, since we may not be implementing authentication
    try:
        VERSION = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'])
        BRANCH = subprocess.check_output(['git', 'rev-parse', '--symbolic-full-name', '--abbrev-ref', 'HEAD'])
    except:
        VERSION = "Git not installed"
        BRANCH = "Git not installed"


    @staticmethod
    def init_app(app):
        pass

class DevelopmentConfig(Config):
    JSON_STORE_DATA = basedir + "/app/json_save_states/"
    FILE_CONVERSION_WORK_DIR = basedir + "/app/conversion_work/"
    DEBUG = True
    MODE = 'Development'

class ProductionConfig(Config):
    JSON_STORE_DATA = basedir + "/app/json_save_states/"
    FILE_CONVERSION_WORK_DIR = basedir + "/app/conversion_work/"
    MODE ='Production'

class TestingConfig(Config):
    JSON_STORE_DATA = basedir + "/app/json_save_states/"
    FILE_CONVERSION_WORK_DIR = basedir + "/app/conversion_work/"
    MODE = 'Testing'


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
