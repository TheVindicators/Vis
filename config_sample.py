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
    DEBUG = True
    MODE = 'Development'

class ProductionConfig(Config):
    MODE ='Production'

class TestingConfig(Config):
    MODE = 'Testing'


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
