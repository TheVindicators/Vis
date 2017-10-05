from flask import render_template, request
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
        return "Save OK"
    return "Save Failed! :("


#This URL (website.com/rest/resume_state) is used to fetch the JSON file of the state requested by the user.
#The user requests the UUID of the specific JSON file, which is fetched and dumped back to client.
#JSON schema TBD
@rest.route('/resume_state', methods=["GET", "POST"])
def resume_state():
    if request.method == "POST":
        #fetch uuid
        #dump file
        return "<json file of state here>"
