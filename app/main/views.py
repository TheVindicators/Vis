from flask import render_template, current_app
from . import main
import os

@main.route('/')
def index():
    states = []
    for save_state in os.listdir(current_app.config["JSON_STORE_DATA"]):
        states.append(save_state[:-5]) #Only return the UUID, remove .json ending
    return render_template('editor.html', states=states)
