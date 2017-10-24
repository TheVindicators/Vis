from flask import render_template, request, current_app
from werkzeug.utils import secure_filename
from . import rest
import json, uuid, os, subprocess


#This URL (website.com/rest/debug) is used to test the website and provide debug output. It's really only a developer tool.
@rest.route('/debug')
def rest_debug():
    return render_template("debug.html")


#This URL (website.com/rest/convert_object) is used by the client when it receives an object file it doesn't understand.
#Rather than doing the conversion client-side, we've made the conscience decision to do this server-side. It's easier in Python; plus the
#server will be more powerful than the client for such a task.
#The server will then send the file back to the client after file conversion is complete. Because this may take a few seconds, async
#javascript requests is an absolute must to prevent client lockup.
@rest.route('/convert_object', methods=["GET", "POST"])
def convert_object():
    if request.method == "POST":
        try:
            file_data = request.data
            with open("temp.flt", 'w+') as flt_file:
                flt_file.write(file_data)
            subprocess.check_output("osgconv temp.flt temp.obj")
            with open("temp.obj", 'r') as converted_file:
                print "Nice, let's get this out onto a tray."
                return converted_file.read()
        except as err:
            return str(err)



#This URL (website.com/rest/save_state) is used by the client to save their current state, represented as a JSON file.
#The client is responsible for POSTing the data, the server will never prompt the client to save.

#We're going to assume a 5 second timer for autosaving. The server is responsible for generating a UUID on first load, when
#the user first selects their state (i.e. new, resume). Then, that UUID is forever used as the official representation of that state.
#JSON schema TBD

@rest.route('/save_state', methods=["GET", "POST"])
def save_state():
    if request.method == "POST":
        try:
            state = request.get_json(request.data)
            #Check to see if the POSTed save state has a UUID. If not, then this is a new project and we need to generate a UUID for it.
            if "uuid" not in state["project"] or state["project"]["uuid"] == "":
                state["project"]["uuid"] = str(uuid.uuid4())
            #Save the save state to the appropriate folder. The file is named 'UUID.json'
            with open(current_app.config["JSON_STORE_DATA"] + secure_filename(str(state["project"]["uuid"])) + ".json", 'w+') as save_state_file:
                save_state_file.write(json.dumps(state))
            print "I'm saving: " + state["project"]["uuid"]
            return state["project"]["uuid"] #Return the UUID if successful. This is used by the client to receive the UUID on the first initial save.
        except:
            return "FAIL" #Something went wrong. Let's be purposely dense about what went wrong.
    return "FAIL" #How'd we get here? Someone trying to load the page?


#This URL (website.com/rest/resume_state) is used to fetch the JSON file of the state requested by the user.
#The user requests the UUID of the specific JSON file, which is fetched and dumped back to client.
#JSON schema TBD
@rest.route('/resume_state/', methods=["GET", "POST"])
@rest.route('/resume_state/<uuid>', methods=["GET", "POST"])
def resume_state(uuid=None):
    if uuid == None: #We're looking to see which save states we have
        states = ""
        try:
            for save_state in os.listdir(current_app.config["JSON_STORE_DATA"]):
                states += save_state[:-5] + "," #Only return the UUID, remove .json ending
            return str(states[:-1])
        except:
            return "FAIL" #Something went wrong. Let's be purposely dense about what went wrong.
    else: #We're requesting a specific UUID to resume from.
        try:
            with open(current_app.config["JSON_STORE_DATA"] + secure_filename(str(uuid))+ ".json", 'r') as save_state_file:
                return save_state_file.read()
        except:
            return "FAIL"
    return "FAIL" #How'd we get here?
