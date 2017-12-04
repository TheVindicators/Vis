from flask import render_template, request, current_app, jsonify
from werkzeug.utils import secure_filename
from . import rest
import json, uuid, os, subprocess, time


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
            temp_file_name = str(int(time.time()))
            with open(current_app.config["FILE_CONVERSION_WORK_DIR"] + temp_file_name + ".flt", 'w+') as flt_file:
                flt_file.write(file_data)
            print "osgconv " + current_app.config["FILE_CONVERSION_WORK_DIR"] + temp_file_name + ".flt " + current_app.config["FILE_CONVERSION_WORK_DIR"] + temp_file_name + ".obj"
            subprocess.call("osgconv " + current_app.config["FILE_CONVERSION_WORK_DIR"] + temp_file_name + ".flt " + current_app.config["FILE_CONVERSION_WORK_DIR"] + temp_file_name + ".obj", shell=True)
            with open(current_app.config["FILE_CONVERSION_WORK_DIR"] + temp_file_name + ".obj", 'r') as converted_file:
                return converted_file.read()
        except Exception as e:
            return str(e), 500



#This URL (website.com/rest/save_state) is used by the client to save their current state, represented as a JSON file.
#The client is responsible for POSTing the data, the server will never prompt the client to save.

#We're going to assume a 5 second timer for autosaving. The server is responsible for generating a UUID on first load, when
#the user first selects their state (i.e. new, resume). Then, that UUID is forever used as the official representation of that state.
#JSON schema TBD

@rest.route('/save_state', methods=["POST"])
def save_state():
    try:
        state = request.get_json(request.data)
        if "project" not in state or "scene" not in state or "camera" not in state or "metadata" not in state:
            return jsonify({"results": "FAIL", "reason": "BADPOST", "error": "non-valid JSON save state"}), 400
        #Check to see if the POSTed save state has a UUID. If not, then this is a new project and we need to generate a UUID for it.
        if "uuid" not in state["project"] or state["project"]["uuid"] == "":
            state["project"]["uuid"] = str(uuid.uuid4())
        #Save the save state to the appropriate folder. The file is named 'UUID.json'
        with open(current_app.config["JSON_STORE_DATA"] + secure_filename(str(state["project"]["uuid"])) + ".json", 'w+') as save_state_file:
            save_state_file.write(json.dumps(state))
        print "I'm saving: " + state["project"]["uuid"]
        return jsonify({"results": "SUCCESS", "uuid": state["project"]["uuid"]}) #Return the UUID if successful. This is used by the client to receive the UUID on the first initial save.
    except IOError as error: #Disk error on save
        return jsonify({"results": "FAIL", "reason": "IOERROR", "error": str(error.errno), "errorstring": str(error.strerror)}), 500
    except TypeError as error: #Save state format error
        return jsonify({"results": "FAIL", "reason": "BADPOST", "error": str(error)}), 400
    except Exception as error: #Other general error
        return jsonify({"results": "FAIL", "reason": "OTHER", "error": str(error)}), 400
    return jsonify({"results": "FAIL", "reason": "OTHER"}), 400 #How'd we get here? Someone trying to load the page?


#This URL (website.com/rest/resume_state) is used to fetch the JSON file of the state requested by the user.
#The user requests the UUID of the specific JSON file, which is fetched and dumped back to client.
#JSON schema TBD
@rest.route('/resume_state', methods=["GET", "POST"])
@rest.route('/resume_state/<uuid>', methods=["GET", "POST"])
def resume_state(uuid=None):
    if uuid == None: #We're looking to see which save states we have
        states = ""
        try:
            for save_state in os.listdir(current_app.config["JSON_STORE_DATA"]):
                if save_state[-5:] == ".json":
                    states += save_state[:-5] + "," #Only return the UUID, remove .json ending
            return jsonify({"results": "SUCCESS", "data": str(states[:-1])})
        except Exception as error: #There was an error listing the directory, return general error
            return jsonify({"results": "FAIL", "reason": "OTHER", "error": str(error)}), 500
    else: #We're requesting a specific UUID to resume from.
        try:
            with open(current_app.config["JSON_STORE_DATA"] + secure_filename(str(uuid))+ ".json", 'r') as save_state_file:
                return save_state_file.read()
        except Exception as error: #Other general error
            return jsonify({"results": "FAIL", "reason": "OTHER", "error": str(error)}), 500
    return "FAIL" #How'd we get here?
