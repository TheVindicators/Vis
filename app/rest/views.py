from flask import render_template, request, current_app
import json, uuid, os
from . import rest


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
    return "<json file of converted object here>"



#This URL (website.com/rest/save_state) is used by the client to save their current state, represented as a JSON file.
#The client is responsible for POSTing the data, the server will never prompt the client to save.

#We're going to assume a 5 second timer for autosaving. The server is responsible for generating a UUID on first load, when
#the user first selects their state (i.e. new, resume). Then, that UUID is forever used as the official representation of that state.
#JSON schema TBD

@rest.route('/save_state', methods=["GET", "POST"])
def save_state():
    if request.method == "POST":
        state = request.get_json(request.data)
        if "uuid" not in state["project"] or state["project"]["uuid"] == "":
            state["project"]["uuid"] = str(uuid.uuid4())
        with open(current_app.config["JSON_STORE_DATA"] + state["project"]["uuid"] + ".json", 'w+') as save_state_file:
            save_state_file.write(json.dumps(state))
        print "I'm saving: " + state["project"]["uuid"]
        return state["project"]["uuid"]
    return "FAIL"


#This URL (website.com/rest/resume_state) is used to fetch the JSON file of the state requested by the user.
#The user requests the UUID of the specific JSON file, which is fetched and dumped back to client.
#JSON schema TBD
@rest.route('/resume_state/', methods=["GET", "POST"])
@rest.route('/resume_state/<uuid>', methods=["GET", "POST"])
def resume_state(uuid=None):
    if uuid == None:
        #We're looking to see which save states we have
        states = ""
        for save_state in os.listdir(current_app.config["JSON_STORE_DATA"]):
            states += save_state[:-5] + "," #Only return the UUID, remove .json ending
        return str(states[:-1])
    else:
        #We're requesting a specific UUID to resume from.
        with open(current_app.config["JSON_STORE_DATA"] + str(uuid)+ ".json", 'r') as save_state_file:
            return save_state_file.read()
    return None
