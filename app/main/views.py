from flask import render_template, current_app
from . import main
import os

@main.route('/')
def index():
    return render_template('editor.html')
